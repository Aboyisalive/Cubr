package cubecore

import (
	"fmt"
	"strings"
)

var faceOf = map[byte]int{'U': FaceU, 'R': FaceR, 'F': FaceF, 'D': FaceD, 'L': FaceL, 'B': FaceB}

// ParseMoves parses standard WCA notation ("R U R' U2 F'") into a move sequence.
// Tokens are whitespace-separated; suffix ' means counter-clockwise, 2 a half turn.
func ParseMoves(s string) ([]Move, error) {
	fields := strings.Fields(s)
	out := make([]Move, 0, len(fields))
	for _, tok := range fields {
		face, ok := faceOf[tok[0]]
		if !ok {
			return nil, fmt.Errorf("unknown face in move %q", tok)
		}
		turns := 1
		switch {
		case len(tok) == 1:
		case len(tok) == 2 && tok[1] == '\'':
			turns = 3
		case len(tok) == 2 && tok[1] == '2':
			turns = 2
		case len(tok) == 3 && tok[1] == '2' && tok[2] == '\'': // "U2'" tolerated
			turns = 2
		default:
			return nil, fmt.Errorf("malformed move %q", tok)
		}
		out = append(out, Move{Face: face, Turns: turns})
	}
	return out, nil
}

// FormatMoves renders a move sequence back to WCA notation.
func FormatMoves(moves []Move) string {
	var b strings.Builder
	for i, m := range moves {
		if i > 0 {
			b.WriteByte(' ')
		}
		b.WriteByte(faceLetters[m.Face])
		switch m.Turns % 4 {
		case 2:
			b.WriteByte('2')
		case 3:
			b.WriteByte('\'')
		}
	}
	return b.String()
}
