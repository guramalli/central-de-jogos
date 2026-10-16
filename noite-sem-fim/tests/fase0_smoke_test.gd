extends SceneTree
## Teste automatizado da FASE 0 (rodar com: godot --headless --path . -s res://tests/fase0_smoke_test.gd).
## Sai com código 0 só se todos os itens passarem.

const PASTAS := [
	"res://assets/characters/protagonist/source",
	"res://assets/characters/protagonist/directions",
	"res://assets/characters/protagonist/animations",
	"res://assets/maps/room_01/floor",
	"res://assets/maps/room_01/walls",
	"res://assets/maps/room_01/props",
	"res://assets/maps/room_01/lighting",
	"res://scenes/tests",
	"res://scenes/characters",
	"res://scenes/maps",
	"res://scripts/characters",
	"res://scripts/camera",
	"res://scripts/occlusion",
	"res://tests",
	"res://docs/acceptance",
]

var _falhas := 0

func _check(nome: String, ok: bool, detalhe := "") -> void:
	if not ok:
		_falhas += 1
	print("%s  %s%s" % ["PASSOU" if ok else "FALHOU", nome, ("  (" + detalhe + ")") if detalhe else ""])

func _initialize() -> void:
	var v := Engine.get_version_info()
	_check("Godot 4.x", v.major == 4, v.string)
	_check("nome do projeto", ProjectSettings.get_setting("application/config/name") == "Noite Sem Fim")
	var metodo: String = ProjectSettings.get_setting("rendering/renderer/rendering_method")
	_check("renderizador provisório gl_compatibility", metodo == "gl_compatibility", metodo)
	_check("filtro de textura linear (não pixel art)",
		ProjectSettings.get_setting("rendering/textures/canvas_textures/default_texture_filter") == 1)
	var imp: Dictionary = ProjectSettings.get_setting("importer_defaults/texture", {})
	_check("importação de textura sem perdas", imp.get("compress/mode", -1) == 0, str(imp))
	_check("importação corrige borda de alpha", imp.get("process/fix_alpha_border", false) == true)
	for p in PASTAS:
		_check("pasta " + p, DirAccess.dir_exists_absolute(p))
	_check("referências fora do importador (.gdignore)", FileAccess.file_exists("res://reference/.gdignore"))
	_check("docs/decisions.md existe", FileAccess.file_exists("res://docs/decisions.md"))

	var main: String = ProjectSettings.get_setting("application/run/main_scene")
	_check("cena principal configurada", main == "res://scenes/tests/test_vazio.tscn", main)
	var cena := load(main) as PackedScene
	_check("cena de teste carrega", cena != null)
	if cena:
		var no := cena.instantiate()
		_check("cena de teste instancia", no != null)
		root.add_child(no)
		await process_frame
		await process_frame
		_check("cena de teste roda 2 quadros", no.is_inside_tree() and no.get_node("Info").text.begins_with("Noite Sem Fim"))
		no.queue_free()
		await process_frame
	print("RESULTADO: %s (%d falha(s))" % ["PASSOU" if _falhas == 0 else "FALHOU", _falhas])
	quit(1 if _falhas else 0)
