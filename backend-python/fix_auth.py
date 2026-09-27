with open('app/api/auth.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''    user = await User.find_one(
        {
            "$or": [
                {"enrollment_number": identifier.upper()},
                {"email": identifier.lower()},
            ]
        }
    )'''

new = '''    from beanie.operators import Or
    user = await User.find_one(
        Or(User.enrollment_number == identifier.upper(), User.email == identifier.lower())
    )'''

content = content.replace(old, new)

with open('app/api/auth.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated auth.py")
