package com.cubr.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cubr.app.theme.CubrTheme

enum class CubrTab(val label: String, val icon: ImageVector) {
    Home("Home", Icons.Filled.Home),
    Learn("Learn", Icons.Filled.School),
    Scan("Scan", Icons.Filled.CameraAlt),
    Timer("Timer", Icons.Filled.Timer),
    Algorithms("Algorithms", Icons.Filled.GridView),
}

@Composable
fun App() {
    // null = follow the system, like the web theme's default.
    var darkOverride by remember { mutableStateOf<Boolean?>(null) }
    val systemDark = androidx.compose.foundation.isSystemInDarkTheme()
    val darkTheme = darkOverride ?: systemDark

    CubrTheme(darkTheme = darkTheme) {
        var tab by remember { mutableStateOf(CubrTab.Home) }
        Scaffold(
            bottomBar = {
                CubrBottomBar(current = tab, onSelect = { tab = it })
            },
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) {
                when (tab) {
                    CubrTab.Home -> HomePage(
                        darkTheme = darkTheme,
                        onToggleTheme = { darkOverride = !darkTheme },
                    )
                    CubrTab.Learn -> PlaceholderPage(
                        "Learn",
                        "Guided, step-by-step solving lands with the guide engine (Phase 4).",
                    )
                    CubrTab.Scan -> PlaceholderPage(
                        "Scan",
                        "Camera scanning lands in Phase 2. This central button opens it from anywhere.",
                    )
                    CubrTab.Timer -> PlaceholderPage(
                        "Timer",
                        "Solve timer, scrambles and history arrive after the MVP (roadmap 6).",
                    )
                    CubrTab.Algorithms -> PlaceholderPage(
                        "Algorithms",
                        "The OLL, PLL and F2L library arrives with pro mode (roadmap 5).",
                    )
                }
            }
        }
    }
}

@Composable
private fun CubrBottomBar(current: CubrTab, onSelect: (CubrTab) -> Unit) {
    NavigationBar {
        NavigationBarItem(
            selected = current == CubrTab.Home,
            onClick = { onSelect(CubrTab.Home) },
            icon = { Icon(CubrTab.Home.icon, contentDescription = null) },
            label = { Text(CubrTab.Home.label) },
        )
        NavigationBarItem(
            selected = current == CubrTab.Learn,
            onClick = { onSelect(CubrTab.Learn) },
            icon = { Icon(CubrTab.Learn.icon, contentDescription = null) },
            label = { Text(CubrTab.Learn.label) },
        )
        // Central Scan action: a raised round button, not a destination tab.
        Box(Modifier.padding(horizontal = 8.dp), contentAlignment = Alignment.Center) {
            FloatingActionButton(
                onClick = { onSelect(CubrTab.Scan) },
                shape = CircleShape,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 4.dp),
                modifier = Modifier.size(56.dp),
            ) {
                Icon(CubrTab.Scan.icon, contentDescription = "Scan a cube")
            }
        }
        NavigationBarItem(
            selected = current == CubrTab.Timer,
            onClick = { onSelect(CubrTab.Timer) },
            icon = { Icon(CubrTab.Timer.icon, contentDescription = null) },
            label = { Text(CubrTab.Timer.label) },
        )
        NavigationBarItem(
            selected = current == CubrTab.Algorithms,
            onClick = { onSelect(CubrTab.Algorithms) },
            icon = { Icon(CubrTab.Algorithms.icon, contentDescription = null) },
            label = { Text(CubrTab.Algorithms.label) },
        )
    }
}

@Composable
private fun HomePage(darkTheme: Boolean, onToggleTheme: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            "cubr",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "Scan it. See it. Solve it.",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(12.dp))
        Text("This is the F0.10 scaffold: themed placeholders, real navigation.")
        Spacer(Modifier.height(12.dp))
        Text(if (darkTheme) "Dark theme" else "Light theme")
        Switch(checked = darkTheme, onCheckedChange = { onToggleTheme() })
    }
}

@Composable
private fun PlaceholderPage(title: String, body: String) {
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            title,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
        )
        Text(body, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Box(
            Modifier.size(56.dp).background(
                MaterialTheme.colorScheme.primary,
                MaterialTheme.shapes.medium,
            ),
        )
    }
}
