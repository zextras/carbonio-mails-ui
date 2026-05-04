/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE } from '../constants';
import {
	PreviewSaveAttachmentProviderContext,
	usePreviewSaveAttachmentProviders
} from '../use-preview-save-attachment-providers';
import { useActions } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';

const singleAttachmentContext: PreviewSaveAttachmentProviderContext = {
	attachments: [
		{
			filename: 'document.pdf',
			contentType: 'application/pdf',
			size: 12345,
			downloadUrl: 'https://example.com/download/document.pdf'
		}
	]
};

const multipleAttachmentsContext: PreviewSaveAttachmentProviderContext = {
	attachments: [
		{
			filename: 'doc1.pdf',
			contentType: 'application/pdf',
			size: 1000,
			downloadUrl: 'https://example.com/download/doc1.pdf'
		},
		{
			filename: 'image.png',
			contentType: 'image/png',
			size: 2000,
			downloadUrl: 'https://example.com/download/image.png'
		}
	]
};

describe('usePreviewSaveAttachmentProviders', () => {
	beforeEach(() => {
		(useActions as Mock).mockReturnValue([]);
	});

	it('should return an empty array when no providers are registered', () => {
		(useActions as Mock).mockReturnValue([]);

		const { result } = renderHook(() => usePreviewSaveAttachmentProviders(singleAttachmentContext));

		expect(result.current).toEqual([]);
	});

	it('should return an empty array when useActions returns undefined', () => {
		(useActions as Mock).mockReturnValue(undefined);

		const { result } = renderHook(() => usePreviewSaveAttachmentProviders(singleAttachmentContext));

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

		const { result } = renderHook(() => usePreviewSaveAttachmentProviders(singleAttachmentContext));

		expect(result.current).toHaveLength(1);
		expect(result.current[0]).toBe(mockProvider);
	});

	it('should call useActions with the correct type', () => {
		renderHook(() => usePreviewSaveAttachmentProviders(singleAttachmentContext));

		expect(useActions).toHaveBeenCalledWith(
			expect.anything(),
			PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE
		);
	});

	it('should pass the attachments array in the context to useActions', () => {
		renderHook(() => usePreviewSaveAttachmentProviders(singleAttachmentContext));

		const context = (useActions as Mock).mock.calls[0][0];
		expect(context.attachments).toHaveLength(1);
		expect(context.attachments[0].filename).toBe('document.pdf');
		expect(context.attachments[0].contentType).toBe('application/pdf');
		expect(context.attachments[0].size).toBe(12345);
		expect(context.attachments[0].downloadUrl).toBe('https://example.com/download/document.pdf');
	});

	it('should support multiple attachments in the context', () => {
		renderHook(() => usePreviewSaveAttachmentProviders(multipleAttachmentsContext));

		const context = (useActions as Mock).mock.calls[0][0];
		expect(context.attachments).toHaveLength(2);
		expect(context.attachments[0].filename).toBe('doc1.pdf');
		expect(context.attachments[1].filename).toBe('image.png');
	});
});
