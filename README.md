# Copa 2026 - Album

Webapp em Flask para controle do album da Copa do Mundo 2026.

## Recursos

- Cadastro e login de usuarios
- Controle de figurinhas (quantidade, faltantes, repetidas)
- Dashboard com resumo e lista completa
- Seed via CSV

## Requisitos

- Python 3.11+
- PostgreSQL

## Setup (Windows)

1. Crie e ative um venv:

```
python -m venv .venv
.\.venv\Scripts\activate
```

2. Instale dependencias:

```
pip install -r requirements.txt
```

3. Configure o arquivo `.env`:

```
copy .env.example .env
```

4. Crie o banco e rode as migracoes:

```
flask db init
flask db migrate -m "init"
flask db upgrade
```

5. Seed de figurinhas:

```
python seed_stickers.py data\stickers_sample.csv
```

6. Rode a aplicacao:

```
flask --app run.py run
```

## Estrutura

- `app/` - aplicacao Flask
- `data/` - CSV de exemplo
- `seed_stickers.py` - carga inicial de figurinhas

## Notas

- Edite o CSV e rode o seed novamente se quiser outra lista.
- As senhas sao armazenadas com hash.
