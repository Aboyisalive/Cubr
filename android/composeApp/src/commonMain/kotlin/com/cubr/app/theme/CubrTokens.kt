package com.cubr.app.theme

import androidx.compose.ui.graphics.Color

/**
 * Design tokens mirroring web/src/styles/tokens.css (Primitives ->
 * Semantic). Keep values in lockstep with the web tokens; the exported
 * token files will become the single source for both.
 */
object CubrTokens {
    // Primitives (from the web primitive layer; orange sampled from the logo)
    val orange500 = Color(0xFFFF7200)
    val orange400 = Color(0xFFFF8D2E)
    val neutral0 = Color(0xFFFFFFFF)
    val neutral50 = Color(0xFFFAFAFA)
    val neutral100 = Color(0xFFF4F4F5)
    val neutral200 = Color(0xFFE4E4E7)
    val neutral400 = Color(0xFFA1A1AA)
    val neutral600 = Color(0xFF52525B)
    val neutral800 = Color(0xFF27272A)
    val neutral900 = Color(0xFF18181B)
    val neutral950 = Color(0xFF09090B)

    // Cube faces (same hexes as the web primitives)
    val cubeWhite = Color(0xFFFFFFFF)
    val cubeYellow = Color(0xFFFFD500)
    val cubeRed = Color(0xFFC9001B)
    val cubeOrange = orange500
    val cubeBlue = Color(0xFF0057B8)
    val cubeGreen = Color(0xFF009E60)
    val logoGrey = Color(0xFF545455)

    data class Semantic(
        val background: Color,
        val foreground: Color,
        val card: Color,
        val mutedForeground: Color,
        val border: Color,
        val primary: Color,
        val primaryForeground: Color,
    )

    val light = Semantic(
        background = neutral0,
        foreground = neutral950,
        card = neutral0,
        mutedForeground = neutral600,
        border = neutral200,
        primary = orange500,
        primaryForeground = neutral950,
    )

    val dark = Semantic(
        background = neutral950,
        foreground = neutral50,
        card = neutral900,
        mutedForeground = neutral400,
        border = neutral800,
        primary = orange500,
        primaryForeground = neutral950,
    )

    fun semantic(darkTheme: Boolean): Semantic = if (darkTheme) dark else light
}
