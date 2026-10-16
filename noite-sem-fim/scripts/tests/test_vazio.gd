extends Node2D
## Cena vazia de testes da FASE 0: só confirma que o projeto abre e renderiza.
## Não contém personagem, mapa nem mecânica.

func _ready() -> void:
	var v := Engine.get_version_info()
	$Info.text = "Noite Sem Fim — cena de teste vazia (FASE 0)\nGodot %s — renderizador: %s" % [
		v.string, ProjectSettings.get_setting("rendering/renderer/rendering_method")]
	print("TEST_VAZIO_READY godot=", v.string)
