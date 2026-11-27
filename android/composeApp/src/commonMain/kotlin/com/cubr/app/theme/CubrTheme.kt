package com.cubr.app.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private fun colorScheme(darkTheme: Boolean) = with(CubrTokens.semantic(darkTheme)) {
    if (darkTheme) {
        darkColorScheme(
            primary = primary,
            onPrimary = primaryForeground,
            background = background,
            onBackground = foreground,
            surface = card,
            onSurface = foreground,
            onSurfaceVariant = mutedForeground,
            outline = border,
        )
    } else {
        lightColorScheme(
            primary = primary,
            onPrimary = primaryForeground,
            background = background,
            onBackground = foreground,
            surface = card,
            onSurface = foreground,
            onSurfaceVariant = mutedForeground,
            outline = border,
        )
    }
}

/**
 * App theme. Follows the system by default (like the web toggle's
 * "system" mode); an explicit user choice can override it.
 */
@Composable
fun CubrTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = colorScheme(darkTheme),
        content = content,
    )
}
