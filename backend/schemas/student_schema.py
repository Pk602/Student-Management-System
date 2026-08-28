from marshmallow import Schema, fields, validate


COURSE_OPTIONS = ["AIDS", "AIML", "IIOT", "AR"]
GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"]


class StudentSchema(Schema):

    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100)
    )

    cgpa = fields.Float(
        required=True,
        validate=validate.Range(min=0, max=10)
    )

    course = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.OneOf(
            COURSE_OPTIONS,
            error="Course must be one of: AIDS, AIML, IIOT, AR"
        )
    )

    program = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=50)
    )

    class_name = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=50)
    )

    year_of_study = fields.Int(
        required=False,
        allow_none=True,
        validate=validate.Range(
            min=1,
            max=4,
            error="Year of study must be between 1 and 4"
        )
    )

    admission_year = fields.Int(
        required=False,
        allow_none=True,
        validate=validate.Range(
            min=1900,
            max=2100,
            error="Admission year must be a valid 4-digit year"
        )
    )

    graduation_year = fields.Int(
        required=False,
        allow_none=True,
        validate=validate.Range(
            min=1900,
            max=2100,
            error="Graduation year must be a valid 4-digit year"
        )
    )

    gender = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.OneOf(
            GENDER_OPTIONS,
            error="Gender must be one of: Male, Female, Other, Prefer not to say"
        )
    )

    user_id = fields.Int(
        required=False,
        allow_none=True
    )


