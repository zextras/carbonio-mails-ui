/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { ADD_ATTACHMENT_PROVIDER_TYPE } from '../constants';
import { useAddFromExternal } from '../use-add-from-external';
import { useActions } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';

describe('useAddFromExternal', () => {
	const editorId = 'test-editor-id';

	beforeEach(() => {
		const editor = generateNewMessageEditor();
		editor.id = editorId;
		setupEditorStore({ editors: [editor] });
		(useActions as Mock).mockReturnValue([]);
	});

	it('should return an empty array when no external providers are registered', () => {
		(useActions as Mock).mockReturnValue([]);

		const { result } = renderHook(() => useAddFromExternal({ editorId }));

		expect(result.current).toEqual([]);
	});

	it('should return an empty array when useActions returns undefined', () => {
		(useActions as Mock).mockReturnValue(undefined);

		const { result } = renderHook(() => useAddFromExternal({ editorId }));

		expect(result.current).toEqual([]);
	});

	it('should return providers returned by useActions', () => {
		const mockProvider = {
			id: 'nextcloud-add-attachment',
			label: 'Add from Nextcloud',
			icon: 'CloudUploadOutline',
			execute: vi.fn()
		};
		(useActions as Mock).mockReturnValue([mockProvider]);

		const { result } = renderHook(() => useAddFromExternal({ editorId }));

		expect(result.current).toHaveLength(1);
		expect(result.current[0]).toBe(mockProvider);
	});

	it('should call useActions with the correct type', () => {
		renderHook(() => useAddFromExternal({ editorId }));

		expect(useActions).toHaveBeenCalledWith(expect.anything(), ADD_ATTACHMENT_PROVIDER_TYPE);
	});

	it('should pass onFilesSelected in the context to useActions', () => {
		renderHook(() => useAddFromExternal({ editorId }));

		const context = (useActions as Mock).mock.calls[0][0];
		expect(typeof context.onFilesSelected).toBe('function');
	});
});
