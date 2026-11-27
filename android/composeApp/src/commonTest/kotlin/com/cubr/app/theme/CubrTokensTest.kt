package com.cubr.app.theme

import androidx.compose.ui.graphics.Color
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

/**
 * The mobile tokens must match the web tokens
 * (web/src/styles/tokens.css) value for value.
 */
class CubrTokensTest {
    @Test
    fun brandOrangeMatchesLogoAndWeb() {
        assertEquals(Color(0xFFFF7200), CubrTokens.orange500)
        assertEquals(CubrTokens.orange500, CubrTokens.light.primary)
        assertEquals(CubrTokens.orange500, CubrTokens.dark.primary)
    }

    @Test
    fun backgroundsMatchWebSemantics() {
        assertEquals(Color(0xFFFFFFFF), CubrTokens.light.background)
        assertEquals(Color(0xFF09090B), CubrTokens.dark.background)
        assertEquals(Color(0xFF18181B), CubrTokens.dark.card)
        assertNotEquals(CubrTokens.light.background, CubrTokens.dark.background)
    }

    @Test
    fun cubeFacesMatchWebPrimitives() {
        assertEquals(Color(0xFFFFD500), CubrTokens.cubeYellow)
        assertEquals(Color(0xFFC9001B), CubrTokens.cubeRed)
        assertEquals(Color(0xFF0057B8), CubrTokens.cubeBlue)
        assertEquals(Color(0xFF009E60), CubrTokens.cubeGreen)
        assertEquals(Color(0xFF545455), CubrTokens.logoGrey)
    }

    @Test
    fun semanticSwitchesWithTheme() {
        assertEquals(CubrTokens.light, CubrTokens.semantic(darkTheme = false))
        assertEquals(CubrTokens.dark, CubrTokens.semantic(darkTheme = true))
    }
}
