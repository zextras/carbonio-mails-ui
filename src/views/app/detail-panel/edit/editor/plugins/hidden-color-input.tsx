/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import styled from '@emotion/styled';

/**
 * Visually hidden `<input type="color">` meant to be opened programmatically
 * via `click()`. The browser anchors the native color picker popup to the
 * input's bounding box, so the input must keep a (1px) layout box at the point
 * the popup should attach to — hiding it with `display: none` would detach the
 * popup to the window corner. Render it inside a positioned element placed at
 * the desired anchor.
 */
export const HiddenColorInput = styled.input`
	position: absolute;
	left: 0;
	bottom: 0;
	width: 0.0625rem;
	height: 0.0625rem;
	padding: 0;
	margin: 0;
	border: 0;
	opacity: 0;
	pointer-events: none;
`;
