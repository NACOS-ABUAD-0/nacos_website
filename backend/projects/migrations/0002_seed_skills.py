from django.db import migrations

def seed_skills(apps, schema_editor):
    SkillTag = apps.get_model('projects', 'SkillTag')
    skills = [
        "React", "Python", "Django", "JavaScript", "TypeScript",
        "Tailwind CSS", "PostgreSQL", "Node.js", "Next.js", "GraphQL",
        "Flask", "Vue.js", "Angular", "MongoDB", "Express.js",
        "REST API", "Machine Learning", "Data Science", "UI/UX", "Figma"
    ]
    for name in skills:
        SkillTag.objects.get_or_create(name=name)

def reverse_seed(apps, schema_editor):
    SkillTag = apps.get_model('projects', 'SkillTag')
    SkillTag.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0001_initial'),  # adjust to your last migration
    ]
    operations = [
        migrations.RunPython(seed_skills, reverse_seed),
    ]