/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';
import { HttpResponse } from 'msw';

import { MailsEditorV2 } from '../../../../types';
import { setupHook } from '@test-setup';
import {
	APIInterceptor,
	createAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorDraftSave, useSaveDraftFromEditor } from 'store/editor/hooks/save-draft';

const setSaveDraftDelaySetting = (value: string): void => {
	vi.spyOn(shell, 'getUserSettings').mockImplementation(
		vi.fn(() => ({
			attrs: {},
			prefs: {
				zimbraPrefAutoSaveDraftInterval: value
			},
			props: []
		}))
	);
};
const setupSaveDraftTest = (): { editor: MailsEditorV2 } => {
	const editor = generateNewMessageEditor();
	setupEditorStore({ editors: [editor] });
	return {
		editor
	};
};
const setupSaveDraftApi = (): { saveDraftApi: APIInterceptor } => ({
	saveDraftApi: createAPIInterceptor('post', '/service/soap/SaveDraftRequest', HttpResponse.json())
});

const expectedCallsAfterSeconds = async ({
	seconds,
	api,
	calls
}: {
	seconds: number;
	api: APIInterceptor;
	calls: number;
}): Promise<void> => {
	await vi.advanceTimersByTimeAsync(seconds * 1000);
	expect(api.getCalledTimes()).toBe(calls);
};

describe('useEditorDraftSave', () => {
	it('should return an object with specific data and callbacks', () => {
		const { editor } = setupSaveDraftTest();
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

	describe('Immediate save draft', () => {
		it('calls the SaveDraft immediately', async () => {
			const { editor } = setupSaveDraftTest();
			const { result: hookResult } = setupHook(useSaveDraftFromEditor, {});
			const { saveDraftApi } = setupSaveDraftApi();

			act(() => hookResult.current.immediateSaveDraft(editor.id));
			// Well, "Almost!" immediately
			await vi.advanceTimersByTimeAsync(100);
			expect(saveDraftApi.getCalledTimes()).toBe(1);
		});
	});
	describe('Debounced save draft', () => {
		it('calls the SaveDraft after 2 seconds by default', async () => {
			const { editor } = setupSaveDraftTest();
			const { result: hookResult } = setupHook(useSaveDraftFromEditor, {});
			const { saveDraftApi } = setupSaveDraftApi();

			act(() => hookResult.current.debouncedSaveDraft(editor.id));
			await expectedCallsAfterSeconds({ seconds: 0, api: saveDraftApi, calls: 0 });
			await expectedCallsAfterSeconds({ seconds: 1, api: saveDraftApi, calls: 0 });
			await expectedCallsAfterSeconds({ seconds: 1, api: saveDraftApi, calls: 1 });
		});
		it('debounces the previous save draft call when invoked again', async () => {
			const { editor } = setupSaveDraftTest();
			const { result: hookResult } = setupHook(useSaveDraftFromEditor, {});
			const { saveDraftApi } = setupSaveDraftApi();

			act(() => hookResult.current.debouncedSaveDraft(editor.id));
			await expectedCallsAfterSeconds({ seconds: 0, api: saveDraftApi, calls: 0 });
			await expectedCallsAfterSeconds({ seconds: 1, api: saveDraftApi, calls: 0 });
			act(() => hookResult.current.debouncedSaveDraft(editor.id));
			await expectedCallsAfterSeconds({ seconds: 0, api: saveDraftApi, calls: 0 });
			await expectedCallsAfterSeconds({ seconds: 1, api: saveDraftApi, calls: 0 });
			await expectedCallsAfterSeconds({ seconds: 1, api: saveDraftApi, calls: 1 });
		});
	});

	describe('Save draft delay based on settings', () => {
		it('debounces after 1 seconds if save draft setting is 1 second (less than default)', async () => {
			setSaveDraftDelaySetting('1s');
			const { editor } = setupSaveDraftTest();
			const { result: hookResult } = setupHook(useSaveDraftFromEditor, {});
			const { saveDraftApi } = setupSaveDraftApi();

			act(() => hookResult.current.debouncedSaveDraft(editor.id));
			await expectedCallsAfterSeconds({ seconds: 0, api: saveDraftApi, calls: 0 });
			await expectedCallsAfterSeconds({ seconds: 1, api: saveDraftApi, calls: 1 });
		});
		it('debounces after 2 s if save draft setting is 3 s (more than default)', async () => {
			setSaveDraftDelaySetting('3s');
			const { editor } = setupSaveDraftTest();
			const { result: hookResult } = setupHook(useSaveDraftFromEditor, {});
			const { saveDraftApi } = setupSaveDraftApi();

			act(() => hookResult.current.debouncedSaveDraft(editor.id));
			await expectedCallsAfterSeconds({ seconds: 0, api: saveDraftApi, calls: 0 });
			await expectedCallsAfterSeconds({ seconds: 2, api: saveDraftApi, calls: 1 });
		});
	});
});
