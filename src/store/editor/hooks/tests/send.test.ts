/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { generateNewMessageEditor } from '../../editor-generators';
import { useEditorSend } from '../send';
import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { createSoapAPIInterceptorWithError } from '__test__/generators/api';
import { setupEditorStore } from '__test__/generators/editor-store';
import { useEditorsStore } from 'store/editor/store';
import { MailsEditorV2 } from 'types/editor';

const RECIPIENT_ADDRESS = 'text@demo.com';

describe('send', () => {
	it('should return an object with send and status', () => {
		const editor = generateNewMessageEditor();
		const composedEditor: MailsEditorV2 = {
			...editor,
			subject: 'title',
			recipients: {
				to: [{ type: ParticipantRole.TO, address: RECIPIENT_ADDRESS }],
				cc: [],
				bcc: []
			}
		};

		setupEditorStore({ editors: [composedEditor] });

		const { result } = setupHook(useEditorSend, {
			initialProps: [composedEditor.id]
		});

		expect(result.current).toStrictEqual({
			status: expect.objectContaining({ allowed: expect.any(Boolean) }),
			send: expect.any(Function)
		});
	});
	it('should add beforeunload event listener when send is called', () => {
		const addListenerSpy = vi.spyOn(window, 'addEventListener');

		const editor = generateNewMessageEditor();
		const composedEditor: MailsEditorV2 = {
			...editor,
			subject: 'title',
			recipients: {
				to: [{ type: ParticipantRole.TO, address: RECIPIENT_ADDRESS }],
				cc: [],
				bcc: []
			}
		};

		setupEditorStore({ editors: [composedEditor] });

		const { result } = setupHook(useEditorSend, {
			initialProps: [composedEditor.id]
		});

		act(() => {
			result.current.send();
		});

		expect(addListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
	});
	it('should remove beforeunload event listener when send is successful', async () => {
		const removeListenerSpy = vi.spyOn(window, 'removeEventListener');

		createSoapAPIInterceptor('SendMsg');

		const editor = generateNewMessageEditor();
		const composedEditor: MailsEditorV2 = {
			...editor,
			subject: 'title',
			recipients: {
				to: [{ type: ParticipantRole.TO, address: RECIPIENT_ADDRESS }],
				cc: [],
				bcc: []
			}
		};

		setupEditorStore({ editors: [composedEditor] });

		const { result } = setupHook(useEditorSend, {
			initialProps: [composedEditor.id]
		});

		act(() => {
			result.current.send();
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});

		expect(removeListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
	});
	it('should remove beforeunload event listener when API return Fault', async () => {
		const removeListenerSpy = vi.spyOn(window, 'removeEventListener');

		createSoapAPIInterceptor('SendMsg', buildSoapErrorResponseBody());

		const editor = generateNewMessageEditor();
		const composedEditor: MailsEditorV2 = {
			...editor,
			subject: 'title',
			recipients: {
				to: [{ type: ParticipantRole.TO, address: RECIPIENT_ADDRESS }],
				cc: [],
				bcc: []
			}
		};

		setupEditorStore({ editors: [composedEditor] });

		const { result } = setupHook(useEditorSend, {
			initialProps: [composedEditor.id]
		});

		act(() => {
			result.current.send();
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});

		expect(removeListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
	});
	it('should remove beforeunload event listener on error', async () => {
		const removeListenerSpy = vi.spyOn(window, 'removeEventListener');

		createSoapAPIInterceptorWithError('SendMsg');

		const editor = generateNewMessageEditor();
		const composedEditor: MailsEditorV2 = {
			...editor,
			subject: 'title',
			recipients: {
				to: [{ type: ParticipantRole.TO, address: RECIPIENT_ADDRESS }],
				cc: [],
				bcc: []
			}
		};

		setupEditorStore({ editors: [composedEditor] });

		const { result } = setupHook(useEditorSend, {
			initialProps: [composedEditor.id]
		});

		act(() => {
			result.current.send();
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});

		expect(removeListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
	});
	it('should call onSendStart when the send request is issued to the server', async () => {
		createSoapAPIInterceptor('SendMsg');

		const editor = generateNewMessageEditor();
		const composedEditor: MailsEditorV2 = {
			...editor,
			subject: 'title',
			recipients: {
				to: [{ type: ParticipantRole.TO, address: RECIPIENT_ADDRESS }],
				cc: [],
				bcc: []
			}
		};

		setupEditorStore({ editors: [composedEditor] });

		const onSendStart = vi.fn();
		const onComplete = vi.fn();

		const { result } = setupHook(useEditorSend, {
			initialProps: [composedEditor.id]
		});

		act(() => {
			result.current.send({ onSendStart, onComplete });
		});

		// During the countdown the request has not been issued yet
		expect(onSendStart).not.toHaveBeenCalled();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});

		expect(onSendStart).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});
	it('should not call onSendStart when the countdown is canceled before the request is issued', async () => {
		createSoapAPIInterceptor('SendMsg');

		const editor = generateNewMessageEditor();
		const composedEditor: MailsEditorV2 = {
			...editor,
			subject: 'title',
			recipients: {
				to: [{ type: ParticipantRole.TO, address: RECIPIENT_ADDRESS }],
				cc: [],
				bcc: []
			}
		};

		setupEditorStore({ editors: [composedEditor] });

		const onSendStart = vi.fn();

		const { result } = setupHook(useEditorSend, {
			initialProps: [composedEditor.id]
		});

		let sendResult: ReturnType<typeof result.current.send> = {};
		act(() => {
			sendResult = result.current.send({ onSendStart });
		});

		act(() => {
			sendResult.cancel?.();
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});

		expect(onSendStart).not.toHaveBeenCalled();
	});
	it('should delay SendMsg until a draft save started during the countdown completes', async () => {
		const sendMsgCalled = createSoapAPIInterceptor('SendMsg');
		let sendMsgHasBeenCalled = false;
		sendMsgCalled.then(() => {
			sendMsgHasBeenCalled = true;
		});

		const editor = generateNewMessageEditor();
		const composedEditor: MailsEditorV2 = {
			...editor,
			subject: 'title',
			recipients: {
				to: [{ type: ParticipantRole.TO, address: RECIPIENT_ADDRESS }],
				cc: [],
				bcc: []
			}
		};

		setupEditorStore({ editors: [composedEditor] });

		const { result } = setupHook(useEditorSend, {
			initialProps: [composedEditor.id]
		});

		act(() => {
			result.current.send();
		});

		// Simulate a draft save starting during the countdown (e.g. from a pending debounce).
		// The send-allowed status is derived on read, but the countdown is already running and
		// the status check at sendFromEditor start already passed, so the send is not blocked.
		useEditorsStore.getState().setDraftSaveProcessStatus(composedEditor.id, { status: 'running' });

		// Advance time past the countdown — send should now be waiting for the draft save
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});

		expect(sendMsgHasBeenCalled).toBe(false);

		// Simulate draft save completing and wait for SendMsg to follow
		await act(async () => {
			useEditorsStore.getState().setDraftSaveProcessStatus(composedEditor.id, {
				status: 'completed',
				lastSaveTimestamp: new Date()
			});
			await sendMsgCalled;
		});

		expect(sendMsgHasBeenCalled).toBe(true);
	});
});
