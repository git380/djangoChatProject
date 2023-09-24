# Generated by Django 4.2.5 on 2023-09-24 04:48

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='LoginInfo',
            fields=[
                ('login_id', models.CharField(max_length=32, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=64)),
                ('password', models.CharField(max_length=255)),
                ('address', models.CharField(max_length=64)),
                ('role', models.IntegerField()),
            ],
        ),
    ]
