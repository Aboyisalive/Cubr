package cubecore

// Method describes a solving method's stage structure. Mirrors the intent of
// shared/constants/method_defs.ts and feeds the guide engine later.
type Method struct {
	ID     string   `json:"id"`
	Name   string   `json:"name"`
	Stages []string `json:"stages"`
}

// Methods is the registry of methods the engine knows about. The beginner
// (layer-by-layer) method is the one the Phase 2 solve planner emits.
var Methods = []Method{
	{
		ID:   "beginner",
		Name: "Beginner (Layer by Layer)",
		Stages: []string{
			"cross",
			"first-layer-corners",
			"second-layer-edges",
			"last-layer-cross",
			"last-layer-edges",
			"last-layer-corner-permutation",
			"last-layer-corner-orientation",
		},
	},
	{
		ID:     "cfop",
		Name:   "CFOP",
		Stages: []string{"cross", "f2l", "oll", "pll"},
	},
}
