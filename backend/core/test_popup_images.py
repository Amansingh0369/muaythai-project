import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User, UserRole

from .models import PopupImage


def image_file(name='poster.png'):
    """A real (tiny) PNG — ImageField rejects anything that isn't decodable."""
    buffer = io.BytesIO()
    Image.new('RGB', (4, 3), 'red').save(buffer, format='PNG')
    return SimpleUploadedFile(name, buffer.getvalue(), content_type='image/png')


# Keep uploads out of S3: these tests only care about the rows and the routing.
@override_settings(STORAGES={
    'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
})
class PopupImageTestBase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com', password='pass12345', role=UserRole.ADMIN,
        )
        self.customer = User.objects.create_user(email='customer@example.com', password='pass12345')
        self.list_url = reverse('popup-image-list')
        self.active_url = reverse('popup-image-active')

    def detail_url(self, image):
        return reverse('popup-image-detail', args=[image.pk])

    def make_image(self, **kwargs):
        kwargs.setdefault('image', image_file())
        return PopupImage.objects.create(**kwargs)


class ActivePopupImageTests(PopupImageTestBase):
    def test_is_public(self):
        response = self.client.get(self.active_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_returns_null_when_no_image_is_active(self):
        self.make_image(title='Uploaded but not shown')
        response = self.client.get(self.active_url)
        self.assertIsNone(response.data)

    def test_returns_the_active_image(self):
        self.make_image(title='Old poster')
        current = self.make_image(title='Current poster', alt_text='Phuket camp')
        current.activate()

        response = self.client.get(self.active_url)

        self.assertEqual(response.data['id'], current.pk)
        self.assertEqual(response.data['alt_text'], 'Phuket camp')
        self.assertTrue(response.data['image'])


class PopupImagePermissionTests(PopupImageTestBase):
    def test_anonymous_cannot_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_list(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_cannot_upload(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            self.list_url, {'image': image_file()}, format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_cannot_delete(self):
        image = self.make_image()
        self.client.force_authenticate(user=self.customer)
        response = self.client.delete(self.detail_url(image))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PopupImageUploadTests(PopupImageTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_upload_adds_to_the_library_without_activating(self):
        response = self.client.post(
            self.list_url,
            {'image': image_file(), 'title': 'September batch', 'alt_text': 'Phuket camp'},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_active'])
        self.assertEqual(PopupImage.objects.count(), 1)

    def test_upload_can_activate_in_one_call(self):
        previous = self.make_image(title='Old')
        previous.activate()

        response = self.client.post(
            self.list_url,
            {'image': image_file(), 'title': 'New', 'is_active': True},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_active'])
        previous.refresh_from_db()
        self.assertFalse(previous.is_active)

    def test_upload_rejects_a_file_that_is_not_an_image(self):
        response = self.client.post(
            self.list_url,
            {'image': SimpleUploadedFile('notes.txt', b'not an image', content_type='text/plain')},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_returns_the_whole_library(self):
        self.make_image(title='One')
        self.make_image(title='Two')

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class SetCurrentPopupImageTests(PopupImageTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_activate_switches_the_current_image(self):
        first = self.make_image(title='First')
        second = self.make_image(title='Second')
        first.activate()

        response = self.client.post(reverse('popup-image-activate', args=[second.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertFalse(first.is_active)
        self.assertTrue(second.is_active)

    def test_only_one_image_is_ever_active(self):
        images = [self.make_image(title=f'#{index}') for index in range(3)]
        for image in images:
            self.client.post(reverse('popup-image-activate', args=[image.pk]))

        self.assertEqual(PopupImage.objects.filter(is_active=True).count(), 1)

    def test_activating_the_current_image_is_a_no_op(self):
        image = self.make_image(title='Only')
        image.activate()

        response = self.client.post(reverse('popup-image-activate', args=[image.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_active'])

    def test_deactivate_switches_the_popup_off(self):
        image = self.make_image(title='Only')
        image.activate()

        response = self.client.post(reverse('popup-image-deactivate', args=[image.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])
        self.assertIsNone(self.client.get(self.active_url).data)

    def test_patching_is_active_also_switches_the_current_image(self):
        first = self.make_image(title='First')
        second = self.make_image(title='Second')
        first.activate()

        response = self.client.patch(
            self.detail_url(second), {'is_active': True}, format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first.refresh_from_db()
        self.assertFalse(first.is_active)
        self.assertTrue(response.data['is_active'])

    def test_metadata_can_be_edited_without_reuploading(self):
        image = self.make_image(title='Typo')

        response = self.client.patch(
            self.detail_url(image), {'title': 'Fixed', 'alt_text': 'Phuket camp'}, format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Fixed')
        self.assertEqual(response.data['alt_text'], 'Phuket camp')


class DeletePopupImageTests(PopupImageTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_delete_removes_the_image_from_the_library(self):
        image = self.make_image(title='Retired')

        response = self.client.delete(self.detail_url(image))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PopupImage.objects.filter(pk=image.pk).exists())

    def test_delete_removes_the_stored_file(self):
        image = self.make_image()
        storage, name = image.image.storage, image.image.name
        self.assertTrue(storage.exists(name))

        self.client.delete(self.detail_url(image))

        self.assertFalse(storage.exists(name))

    def test_deleting_the_current_image_leaves_the_popup_empty(self):
        image = self.make_image(title='Current')
        image.activate()

        self.client.delete(self.detail_url(image))

        self.assertIsNone(self.client.get(self.active_url).data)
