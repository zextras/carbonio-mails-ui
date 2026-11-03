/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { extractBodyWithInlinedStyles } from 'helpers/inline-styles';

/**
 * Parses HTML that is about to be imported into the editor.
 *
 * Messages from other clients style their content with `<style>` blocks, which
 * Lexical has no node for (they are ignored on import). The rules are inlined on
 * the elements first so the styling is carried by the elements themselves, which
 * is what `GenericContainerNode` and `StyledParagraphNode` preserve. This matches
 * what the send pipeline does anyway (`applyUserPreferenceStyles` inlines the
 * styles and drops the `<style>` tags), and does not depend on the browser
 * exposing parsed stylesheets of detached documents.
 */
export const parseHtmlForImport = (html: string): Document =>
	new DOMParser().parseFromString(extractBodyWithInlinedStyles(html), 'text/html');
