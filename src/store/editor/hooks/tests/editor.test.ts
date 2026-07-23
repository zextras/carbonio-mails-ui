/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { setupEditorStore } from '__test__/generators/editor-store';
import { setupHook } from '__test__/test-setup';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorAreInvalidRecipients } from 'store/editor/hooks/editor';
import { useEditorsStore } from 'store/editor/store';

describe('useEditorAreInvalidRecipients', () => {
	it('returns false when there are no recipients', () => {
		const editor = generateNewMessageEditor();
		editor.recipients = { to: [], cc: [], bcc: [] };
		setupEditorStore({ editors: [editor] });

		const { result } = setupHook(useEditorAreInvalidRecipients, {
			initialProps: [editor.id]
		});

		expect(result.current).toBe(false);
	});

	it('returns false when all "to", "cc" and "bcc" recipients are valid', () => {
		const editor = generateNewMessageEditor();
		editor.recipients = {
			to: [{ type: ParticipantRole.TO, address: 'to@demo.com' }],
			cc: [{ type: ParticipantRole.CARBON_COPY, address: 'cc@demo.com' }],
			bcc: [{ type: ParticipantRole.BLIND_CARBON_COPY, address: 'bcc@demo.com' }]
		};
		setupEditorStore({ editors: [editor] });

		const { result } = setupHook(useEditorAreInvalidRecipients, {
			initialProps: [editor.id]
		});

		expect(result.current).toBe(false);
	});

	it('returns true when the "to" recipients contain an invalid address', () => {
		const editor = generateNewMessageEditor();
		editor.recipients = {
			to: [{ type: ParticipantRole.TO, address: 'not-an-email' }],
			cc: [],
			bcc: []
		};
		setupEditorStore({ editors: [editor] });

		const { result } = setupHook(useEditorAreInvalidRecipients, {
			initialProps: [editor.id]
		});

		expect(result.current).toBe(true);
	});

	it('returns true when the "cc" recipients contain an invalid address', () => {
		const editor = generateNewMessageEditor();
		editor.recipients = {
			to: [{ type: ParticipantRole.TO, address: 'to@demo.com' }],
			cc: [{ type: ParticipantRole.CARBON_COPY, address: 'not-an-email' }],
			bcc: []
		};
		setupEditorStore({ editors: [editor] });

		const { result } = setupHook(useEditorAreInvalidRecipients, {
			initialProps: [editor.id]
		});

		expect(result.current).toBe(true);
	});

	it('returns true when the "bcc" recipients contain an invalid address', () => {
		const editor = generateNewMessageEditor();
		editor.recipients = {
			to: [{ type: ParticipantRole.TO, address: 'to@demo.com' }],
			cc: [],
			bcc: [{ type: ParticipantRole.BLIND_CARBON_COPY, address: 'not-an-email' }]
		};
		setupEditorStore({ editors: [editor] });

		const { result } = setupHook(useEditorAreInvalidRecipients, {
			initialProps: [editor.id]
		});

		expect(result.current).toBe(true);
	});

	it('updates reactively when recipients are changed to invalid values', () => {
		const editor = generateNewMessageEditor();
		editor.recipients = {
			to: [{ type: ParticipantRole.TO, address: 'to@demo.com' }],
			cc: [],
			bcc: []
		};
		setupEditorStore({ editors: [editor] });

		const { result, rerender } = setupHook(useEditorAreInvalidRecipients, {
			initialProps: [editor.id]
		});

		expect(result.current).toBe(false);

		const setter = useEditorsStore.getState().setRecipients;
		act(() => {
			setter(editor.id, {
				to: [{ type: ParticipantRole.TO, address: 'not-an-email' }],
				cc: [],
				bcc: []
			});
		});
		rerender([editor.id]);

		expect(result.current).toBe(true);
	});
});
