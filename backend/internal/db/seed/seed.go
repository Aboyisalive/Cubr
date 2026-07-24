// Package seed loads the built-in algorithm library on first boot.
package seed

import (
	"context"

	"github.com/Aboyisalive/cubr/backend/internal/db/sqlite"
	"github.com/Aboyisalive/cubr/backend/pkg/models"
)

// Algorithms is the built-in case library: full PLL, the everyday OLL cases,
// basic F2L inserts, and the beginner-method building blocks.
var Algorithms = []models.Algorithm{
	// --- PLL (all 21) ---
	{ID: "pll_aa", Set: "PLL", Name: "Aa-Perm", Group: "Aa", Moves: "x L2 D2 L' U' L D2 L' U L'"},
	{ID: "pll_ab", Set: "PLL", Name: "Ab-Perm", Group: "Ab", Moves: "x' L2 D2 L U L' D2 L U' L"},
	{ID: "pll_e", Set: "PLL", Name: "E-Perm", Group: "E", Moves: "x' L' U L D' L' U' L D L' U' L D' L' U L D"},
	{ID: "pll_f", Set: "PLL", Name: "F-Perm", Group: "F", Moves: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"},
	{ID: "pll_ga", Set: "PLL", Name: "Ga-Perm", Group: "Ga", Moves: "R2 U R' U R' U' R U' R2 U' D R' U R D'"},
	{ID: "pll_gb", Set: "PLL", Name: "Gb-Perm", Group: "Gb", Moves: "R' U' R U D' R2 U R' U R U' R U' R2 D"},
	{ID: "pll_gc", Set: "PLL", Name: "Gc-Perm", Group: "Gc", Moves: "R2 U' R U' R U R' U R2 U D' R U' R' D"},
	{ID: "pll_gd", Set: "PLL", Name: "Gd-Perm", Group: "Gd", Moves: "R U R' U' D R2 U' R U' R' U R' U R2 D'"},
	{ID: "pll_h", Set: "PLL", Name: "H-Perm", Group: "H", Moves: "M2 U M2 U2 M2 U M2"},
	{ID: "pll_ja", Set: "PLL", Name: "Ja-Perm", Group: "Ja", Moves: "x R2 F R F' R U2 r' U r U2"},
	{ID: "pll_jb", Set: "PLL", Name: "Jb-Perm", Group: "Jb", Moves: "R U R' F' R U R' U' R' F R2 U' R'"},
	{ID: "pll_na", Set: "PLL", Name: "Na-Perm", Group: "Na", Moves: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"},
	{ID: "pll_nb", Set: "PLL", Name: "Nb-Perm", Group: "Nb", Moves: "R' U R U' R' F' U' F R U R' F R' F' R U' R"},
	{ID: "pll_ra", Set: "PLL", Name: "Ra-Perm", Group: "Ra", Moves: "R U' R' U' R U R D R' U' R D' R' U2 R'"},
	{ID: "pll_rb", Set: "PLL", Name: "Rb-Perm", Group: "Rb", Moves: "R2 F R U R U' R' F' R U2 R' U2 R"},
	{ID: "pll_t", Set: "PLL", Name: "T-Perm", Group: "T", Moves: "R U R' U' R' F R2 U' R' U' R U R' F'"},
	{ID: "pll_ua", Set: "PLL", Name: "Ua-Perm", Group: "Ua", Moves: "M2 U M U2 M' U M2"},
	{ID: "pll_ub", Set: "PLL", Name: "Ub-Perm", Group: "Ub", Moves: "M2 U' M U2 M' U' M2"},
	{ID: "pll_v", Set: "PLL", Name: "V-Perm", Group: "V", Moves: "R' U R' U' y R' F' R2 U' R' U R' F R F"},
	{ID: "pll_y", Set: "PLL", Name: "Y-Perm", Group: "Y", Moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'"},
	{ID: "pll_z", Set: "PLL", Name: "Z-Perm", Group: "Z", Moves: "M' U M2 U M2 U M' U2 M2"},

	// --- OLL (core everyday cases) ---
	{ID: "oll_27", Set: "OLL", Name: "Sune", Group: "27", Moves: "R U R' U R U2 R'"},
	{ID: "oll_26", Set: "OLL", Name: "Anti-Sune", Group: "26", Moves: "R U2 R' U' R U' R'"},
	{ID: "oll_21", Set: "OLL", Name: "H (Double Sune)", Group: "21", Moves: "R U R' U R U' R' U R U2 R'"},
	{ID: "oll_22", Set: "OLL", Name: "Pi", Group: "22", Moves: "R U2 R2 U' R2 U' R2 U2 R"},
	{ID: "oll_23", Set: "OLL", Name: "Headlights", Group: "23", Moves: "R2 D R' U2 R D' R' U2 R'"},
	{ID: "oll_24", Set: "OLL", Name: "T (Chameleon)", Group: "24", Moves: "r U R' U' r' F R F'"},
	{ID: "oll_25", Set: "OLL", Name: "Bowtie", Group: "25", Moves: "F' r U R' U' r' F R"},
	{ID: "oll_28", Set: "OLL", Name: "Stealth", Group: "28", Moves: "r U R' U' r' R U R U' R'"},
	{ID: "oll_57", Set: "OLL", Name: "AUF Edges", Group: "57", Moves: "R U R' U' M' U R U' r'"},
	{ID: "oll_20", Set: "OLL", Name: "Checkers", Group: "20", Moves: "r U R' U' M2 U R U' R' U' M'"},
	{ID: "oll_45", Set: "OLL", Name: "Cross Trigger", Group: "45", Moves: "F R U R' U' F'"},
	{ID: "oll_44", Set: "OLL", Name: "Sideways Cross", Group: "44", Moves: "f R U R' U' f'"},

	// --- F2L basics ---
	{ID: "f2l_1", Set: "F2L", Name: "Basic Right Insert", Group: "1", Moves: "U R U' R'"},
	{ID: "f2l_2", Set: "F2L", Name: "Basic Left Insert", Group: "2", Moves: "U' L' U L"},
	{ID: "f2l_3", Set: "F2L", Name: "Front Right Pair", Group: "3", Moves: "U' F' U F"},
	{ID: "f2l_4", Set: "F2L", Name: "Front Left Pair", Group: "4", Moves: "U F U' F'"},
	{ID: "f2l_split", Set: "F2L", Name: "Split Pair", Group: "5", Moves: "R U' R' U2 F' U' F"},
	{ID: "f2l_hide", Set: "F2L", Name: "Hide and Restore", Group: "6", Moves: "R U R' U2 R U' R' U R U' R'"},

	// --- CROSS ---
	{ID: "cross_daisy", Set: "CROSS", Name: "Daisy Method", Group: "1", Moves: "F2"},
	{ID: "cross_edge", Set: "CROSS", Name: "Edge Flip Insert", Group: "2", Moves: "F U' R U"},

	// --- Beginner building blocks (mirrors the shared planner) ---
	{ID: "beg_trigger", Set: "BEGINNER", Name: "Corner Trigger", Group: "1", Moves: "R U R' U'"},
	{ID: "beg_right", Set: "BEGINNER", Name: "Second Layer Right", Group: "2", Moves: "U R U' R' U' F' U F"},
	{ID: "beg_left", Set: "BEGINNER", Name: "Second Layer Left", Group: "3", Moves: "U' L' U L U F U' F'"},
	{ID: "beg_cross", Set: "BEGINNER", Name: "Yellow Cross", Group: "4", Moves: "F R U R' U' F'"},
	{ID: "beg_sune", Set: "BEGINNER", Name: "Sune (Edge Cycle)", Group: "5", Moves: "R U R' U R U2 R'"},
	{ID: "beg_niklas", Set: "BEGINNER", Name: "Corner Cycle", Group: "6", Moves: "U R U' L' U R' U' L"},
	{ID: "beg_twist", Set: "BEGINNER", Name: "Corner Twist", Group: "7", Moves: "R' D' R D"},
}

// Run inserts any missing library rows (idempotent).
func Run(ctx context.Context, store *sqlite.Store) error {
	for _, a := range Algorithms {
		if err := store.InsertAlgorithm(ctx, a); err != nil {
			return err
		}
	}
	return nil
}
