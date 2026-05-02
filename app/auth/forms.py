from flask_wtf import FlaskForm
from wtforms import PasswordField, StringField, SubmitField
from wtforms.validators import Email, EqualTo, InputRequired, Length


class LoginForm(FlaskForm):
    email = StringField("Email", validators=[InputRequired(), Email(), Length(max=255)])
    password = PasswordField("Senha", validators=[InputRequired(), Length(min=6, max=128)])
    submit = SubmitField("Entrar")


class RegisterForm(FlaskForm):
    email = StringField("Email", validators=[InputRequired(), Email(), Length(max=255)])
    password = PasswordField("Senha", validators=[InputRequired(), Length(min=6, max=128)])
    confirm = PasswordField(
        "Confirmar senha",
        validators=[InputRequired(), EqualTo("password", message="Senhas nao conferem")],
    )
    submit = SubmitField("Criar conta")
