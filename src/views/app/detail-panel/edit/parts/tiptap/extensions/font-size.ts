/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Font-size support for the TipTap editor.
 *
 * TipTap v3 ships an official `FontSize` extension as part of
 * `@tiptap/extension-text-style`: it adds a `fontSize` attribute to the
 * `textStyle` mark and exposes the `setFontSize` / `unsetFontSize` commands.
 * It is re-exported here so the rest of the editor imports font-size handling
 * from a single, stable location (and so it can be swapped for a custom
 * implementation in the future without touching call sites).
 */
import { FontSize } from '@tiptap/extension-text-style';

export { FontSize };
