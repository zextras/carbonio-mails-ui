/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

export const previewContextMock = {
	createPreview: jest.fn(),
	initPreview: jest.fn(),
	openPreview: jest.fn(),
	emptyPreview: jest.fn()
};

export const PreviewsManagerContext = React.createContext(previewContextMock);
