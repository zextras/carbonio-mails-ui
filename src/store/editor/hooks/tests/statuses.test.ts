/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { setupEditorStore } from '../../../../__test__/generators/editor-store';
import { setupHook } from '../../../../__test__/test-setup';
import { generateNewMessageEditor } from '../../editor-generators';
import { useEditorsStore } from '../../store';
import {
	useEditorIsDirty,
	useEditorSendAllowedStatus,
	useEditorSetDirty,
	useHasDirtyEditors
} from '../statuses';

describe('useEditorSendAllowedStatus', () => {
	describe('recipients validation', () => {
		it('does not allow the send when there are no recipients', () => {
			const editor = generateNewMessageEditor();
			editor.recipients = { to: [], cc: [], bcc: [] };
			setupEditorStore({ editors: [editor] });

			const { result } = setupHook(useEditorSendAllowedStatus, {
				initialProps: [editor.id]
			});

			expect(result.current).toEqual({
				allowed: false,
				reason: 'label.missing_recipients'
			});
		});

		it('allows the send when all "to", "cc" and "bcc" recipients are valid', () => {
			const editor = generateNewMessageEditor();
			editor.recipients = {
				to: [{ type: ParticipantRole.TO, address: 'to@demo.com' }],
				cc: [{ type: ParticipantRole.CARBON_COPY, address: 'cc@demo.com' }],
				bcc: [{ type: ParticipantRole.BLIND_CARBON_COPY, address: 'bcc@demo.com' }]
			};
			setupEditorStore({ editors: [editor] });

			const { result } = setupHook(useEditorSendAllowedStatus, {
				initialProps: [editor.id]
			});

			expect(result.current).toEqual({ allowed: true });
		});

		it.each([
			[
				'to',
				{
					to: [{ type: ParticipantRole.TO, address: 'not-an-email' }],
					cc: [],
					bcc: []
				}
			],
			[
				'cc',
				{
					to: [{ type: ParticipantRole.TO, address: 'to@demo.com' }],
					cc: [{ type: ParticipantRole.CARBON_COPY, address: 'not-an-email' }],
					bcc: []
				}
			],
			[
				'bcc',
				{
					to: [{ type: ParticipantRole.TO, address: 'to@demo.com' }],
					cc: [],
					bcc: [{ type: ParticipantRole.BLIND_CARBON_COPY, address: 'not-an-email' }]
				}
			]
		])(
			'does not allow the send when the "%s" recipients contain an invalid address',
			(_, recipients) => {
				const editor = generateNewMessageEditor();
				editor.recipients = recipients;
				setupEditorStore({ editors: [editor] });

				const { result } = setupHook(useEditorSendAllowedStatus, {
					initialProps: [editor.id]
				});

				expect(result.current).toEqual({
					allowed: false,
					reason: 'label.invalid_recipients'
				});
			}
		);

		it('does not allow the send when a recipient is flagged with an error', () => {
			const editor = generateNewMessageEditor();
			editor.recipients = {
				to: [{ type: ParticipantRole.TO, address: 'to@demo.com', error: true }],
				cc: [],
				bcc: []
			};
			setupEditorStore({ editors: [editor] });

			const { result } = setupHook(useEditorSendAllowedStatus, {
				initialProps: [editor.id]
			});

			expect(result.current).toEqual({
				allowed: false,
				reason: 'label.invalid_recipients'
			});
		});

		it('updates reactively when recipients are changed to invalid values', () => {
			const editor = generateNewMessageEditor();
			editor.recipients = {
				to: [{ type: ParticipantRole.TO, address: 'to@demo.com' }],
				cc: [],
				bcc: []
			};
			setupEditorStore({ editors: [editor] });

			const { result, rerender } = setupHook(useEditorSendAllowedStatus, {
				initialProps: [editor.id]
			});

			expect(result.current).toEqual({ allowed: true });

			const setter = useEditorsStore.getState().setRecipients;
			act(() => {
				setter(editor.id, {
					to: [{ type: ParticipantRole.TO, address: 'not-an-email' }],
					cc: [],
					bcc: []
				});
			});
			rerender([editor.id]);

			expect(result.current).toEqual({
				allowed: false,
				reason: 'label.invalid_recipients'
			});
		});
	});
});

describe('useEditorIsDirty', () => {
	it('returns true when the editor has unsaved changes', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = true;

		setupEditorStore({ editors: [editor] });
		const {
			result: { current: isDirty }
		} = setupHook(useEditorIsDirty, { initialProps: [editor.id] });

		expect(isDirty).toBe(true);
	});

	it('returns false when the editor has no unsaved changes', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = false;

		setupEditorStore({ editors: [editor] });
		const {
			result: { current: isDirty }
		} = setupHook(useEditorIsDirty, { initialProps: [editor.id] });

		expect(isDirty).toBe(false);
	});
});

describe('useHasDirtyEditors', () => {
	beforeEach(() => {
		useEditorsStore.setState({ editors: {} });
	});

	it('returns false when there are no editors', () => {
		const {
			result: { current: hasDirtyEditors }
		} = setupHook(useHasDirtyEditors);

		expect(hasDirtyEditors).toBe(false);
	});

	it('returns false when none of the editors has unsaved changes', () => {
		const firstEditor = generateNewMessageEditor();
		firstEditor.isDirty = false;
		const secondEditor = generateNewMessageEditor();
		secondEditor.isDirty = false;

		setupEditorStore({ editors: [firstEditor, secondEditor] });
		const {
			result: { current: hasDirtyEditors }
		} = setupHook(useHasDirtyEditors);

		expect(hasDirtyEditors).toBe(false);
	});

	it('returns true when one of the editors has unsaved changes', () => {
		const cleanEditor = generateNewMessageEditor();
		cleanEditor.isDirty = false;
		const dirtyEditor = generateNewMessageEditor();
		dirtyEditor.isDirty = true;

		setupEditorStore({ editors: [cleanEditor, dirtyEditor] });
		const {
			result: { current: hasDirtyEditors }
		} = setupHook(useHasDirtyEditors);

		expect(hasDirtyEditors).toBe(true);
	});

	it('returns false after the editor with unsaved changes is closed', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = true;

		setupEditorStore({ editors: [editor] });
		const { result } = setupHook(useHasDirtyEditors);

		act(() => {
			useEditorsStore.getState().deleteEditor(editor.id);
		});

		expect(result.current).toBe(false);
	});
});

describe('useEditorSetDirty', () => {
	it('should return an object with two functions: setDirty and resetDirty', () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const {
			result: { current: hookResult }
		} = setupHook(useEditorSetDirty, { initialProps: [editor.id] });

		expect(hookResult).toEqual({
			setDirty: expect.any(Function),
			resetDirty: expect.any(Function)
		});
	});

	describe('setIsDirty function', () => {
		it('sets the dirty value to true', () => {
			const editor = generateNewMessageEditor();

			setupEditorStore({ editors: [editor] });
			const {
				result: {
					current: { setDirty }
				}
			} = setupHook(useEditorSetDirty, { initialProps: [editor.id] });

			act(() => {
				setDirty();
			});
			const { result: updatedResult } = setupHook(useEditorIsDirty, {
				initialProps: [editor.id]
			});

			expect(updatedResult.current).toBe(true);
		});
	});

	describe('resetIsDirty function', () => {
		it('sets the dirty value to false', () => {
			const editor = generateNewMessageEditor();

			setupEditorStore({ editors: [editor] });
			const {
				result: {
					current: { resetDirty }
				}
			} = setupHook(useEditorSetDirty, { initialProps: [editor.id] });

			act(() => {
				resetDirty();
			});
			const { result: updatedResult } = setupHook(useEditorIsDirty, {
				initialProps: [editor.id]
			});

			expect(updatedResult.current).toBe(false);
		});
	});
});
