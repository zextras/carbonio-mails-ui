/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE } from '../constants';
import { usePreviewSaveAttachmentProviders } from '../use-preview-save-attachment-providers';
import { useActions } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';

const defaultContext = {
	filename: 'document.pdf',
	contentType: 'application/pdf',
	size: 12345,
	downloadUrl: 'https://example.com/download/document.pdf'
};

describe('usePreviewSaveAttachmentProviders', () => {
	beforeEach(() => {
		(useActions as Mock).mockReturnValue([]);
	});

	it('should return an empty array when no providers are registered', () => {
		(useActions as Mock).mockReturnValue([]);

		const { result } = renderHook(() => usePreviewSaveAttachmentProviders(defaultContext));

		expect(result.current).toEqual([]);
	});

	it('should return an empty array when useActions returns undefined', () => {
		(useActions as Mock).mockReturnValue(undefined);

		const { result } = renderHook(() => usePreviewSaveAttachmentProviders(defaultContext));

		expect(result.current).toEqual([]);
	});

	it('should return providers returned by useActions', () => {
		const mockProvider = {
			id: 'external-storage-save-attachment',
			label: 'Save to External Storage',
			icon: 'CloudUploadOutline',
			execute: vi.fn()
		};
		(useActions as Mock).mockReturnValue([mockProvider]);

		const { result } = renderHook(() => usePreviewSaveAttachmentProviders(defaultContext));

		expect(result.current).toHaveLength(1);
		expect(result.current[0]).toBe(mockProvider);
	});

	it('should call useActions with the correct type', () => {
		renderHook(() => usePreviewSaveAttachmentProviders(defaultContext));

		expect(useActions).toHaveBeenCalledWith(
			expect.anything(),
			PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE
		);
	});

	it('should pass the attachment context to useActions', () => {
		renderHook(() => usePreviewSaveAttachmentProviders(defaultContext));

		const context = (useActions as Mock).mock.calls[0][0];
		expect(context.filename).toBe(defaultContext.filename);
		expect(context.contentType).toBe(defaultContext.contentType);
		expect(context.size).toBe(defaultContext.size);
		expect(context.downloadUrl).toBe(defaultContext.downloadUrl);
	});
});
