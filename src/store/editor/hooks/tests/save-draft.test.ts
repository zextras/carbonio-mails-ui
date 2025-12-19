/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { setupHook } from '@test-setup';
import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorDraftSave, useSaveDraftFromEditor } from 'store/editor/hooks/save-draft';

describe('useEditorDraftSave', () => {
	it('should return an object with specific data and callbacks', () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { result: hookResult } = setupHook(useEditorDraftSave, {
			initialProps: [editor.id]
		});

		expect(hookResult.current).toEqual({
			status: {
				allowed: true
			},
			saveDraft: expect.anything()
		});
	});

	it.todo('call the saveDraft API function if the immediateSaveDraft is invoked');

	it.todo('call the saveDraft API function after 2 seconds if the saveDraft is invoked');

	it.todo(
		'call the saveDraft API function after 3 seconds if the saveDraft is invoked twice, with a 1 second delay between the 2 invocations'
	);

	it('debounced save draft calls the SaveDraft after 2 seconds by default', async () => {
		vi.useFakeTimers();
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { result: hookResult } = setupHook(useSaveDraftFromEditor, {});
		const saveDraft = createAPIInterceptor(
			'post',
			'/service/soap/SaveDraftRequest',
			HttpResponse.json()
		);

		act(() => hookResult.current.debouncedSaveDraft(editor.id));
		expect(saveDraft.getCalledTimes()).toBe(0);
		await vi.advanceTimersByTimeAsync(1000);
		expect(saveDraft.getCalledTimes()).toBe(0);
		await vi.advanceTimersByTimeAsync(1000);
		expect(saveDraft.getCalledTimes()).toBe(1);
	});
});
