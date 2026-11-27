package com.cubr.app

import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application

/** Desktop entry point: same shared UI, no emulator required. */
fun main() = application {
    Window(onCloseRequest = ::exitApplication, title = "cubr") {
        App()
    }
}
