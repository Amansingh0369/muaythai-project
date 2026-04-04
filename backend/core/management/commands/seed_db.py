import random
from django.core.management.base import BaseCommand
from django.db import transaction
from locations.models import Location
from packages.models import Package

class Command(BaseCommand):
    help = 'Seeds the database with dummy Locations and Packages'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # 1. Create 10 Locations
        locations_data = [
            {'name': 'Elite Muay Thai Academy', 'city': 'Bangkok', 'address': '123 Sukhumvit Soi 11', 'latitude': 13.7425, 'longitude': 100.5544},
            {'name': 'Phuket Fight Club', 'city': 'Phuket', 'address': '45 Rawai Beach Road', 'latitude': 7.7725, 'longitude': 98.3244},
            {'name': 'Bangalore Striking Center', 'city': 'Bangalore', 'address': '89 Indiranagar 100ft Rd', 'latitude': 12.9716, 'longitude': 77.5946},
            {'name': 'Chiang Mai Warrior Gym', 'city': 'Chiang Mai', 'address': '22 Old City Gate', 'latitude': 18.7883, 'longitude': 98.9853},
            {'name': 'Samui Strike Studio', 'city': 'Koh Samui', 'address': 'Chaweng Beach Side', 'latitude': 9.5286, 'longitude': 100.0572},
            {'name': 'Pattaya Power Gym', 'city': 'Pattaya', 'address': 'Beach Rd Soi 7', 'latitude': 12.9276, 'longitude': 100.8771},
            {'name': 'Dubai Deserts Fighter', 'city': 'Dubai', 'address': 'Marina Walk Tower A', 'latitude': 25.0657, 'longitude': 55.1389},
            {'name': 'Singapore Stingers', 'city': 'Singapore', 'address': '12 Boat Quay', 'latitude': 1.2847, 'longitude': 103.8504},
            {'name': 'London Lionheart', 'city': 'London', 'address': 'Kings Cross Arches', 'latitude': 51.5312, 'longitude': -0.1238},
            {'name': 'New York Knockouts', 'city': 'New York', 'address': 'Brooklyn Bridge Park', 'latitude': 40.7061, 'longitude': -73.9969},
        ]

        with transaction.atomic():
            created_locations = []
            for loc_data in locations_data:
                loc, created = Location.objects.get_or_create(
                    name=loc_data['name'],
                    defaults=loc_data
                )
                created_locations.append(loc)
                if created:
                    self.stdout.write(f'Created location: {loc.name}')

            # 2. Create 40+ Packages
            package_types = [
                ('Intro to Striking', 1, 1500, 'Basic 1-day pass for beginners'),
                ('Weekly Warrior', 7, 8500, 'Full week access to group classes'),
                ('Training Camp - Basic', 30, 25000, 'Monthly membership with 2 classes/day'),
                ('Professional Camp', 60, 45000, 'Intensive 2-month pro-training camp'),
                ('One-on-One Session', 1, 3000, 'Personal 60-min private training with a pro'),
            ]

            package_count = 0
            for location in created_locations:
                # Add 4-5 packages per location
                for p_name, p_days, p_price, p_desc in package_types:
                    # Randomize price slightly for variety
                    varied_price = p_price + random.randint(-500, 1000)
                    
                    Package.objects.get_or_create(
                        name=f"{p_name} ({location.name})",
                        location=location,
                        defaults={
                            'description': p_desc,
                            'price': varied_price,
                            'duration_days': p_days,
                            'is_active': True
                        }
                    )
                    package_count += 1

            self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(created_locations)} locations and {package_count} packages.'))
