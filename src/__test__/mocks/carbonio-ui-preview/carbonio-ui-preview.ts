/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

export const previewContextMock = {
	createPreview: vi.fn(),
	initPreview: vi.fn(),
	openPreview: vi.fn(),
	emptyPreview: vi.fn(),
	currentIndex: -1,
	previews: []
};

export const PreviewsManagerContext = React.createContext(previewContextMock);
