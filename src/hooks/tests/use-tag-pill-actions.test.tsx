/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { getSetupServer } from '__test__/vitest-setup';
import { useTagPillActions } from 'hooks/use-tag-pill-actions';
import { ConvActionRequest } from 'types/soap/conv-action';
import { MsgActionRequest } from 'types/soap/msg-action';

const MSG_ACTION_URL = '/service/soap/MsgActionRequest';

describe('useTagPillActions', () => {
	test('removing a tag from a message sends !tag for that message and offers Undo', async () => {
		const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const { result, user } = setupHook(useTagPillActions, {
			initialProps: [{ kind: 'message', ids: ['10'] }]
		});

		act(() => result.current.removeTag('Urgent'));

		const request = await interceptor;
		expect(request.action).toEqual(expect.objectContaining({ id: '10', op: '!tag', tn: 'Urgent' }));
		expect(await screen.findByText('"Urgent" tag removed')).toBeInTheDocument();

		const undo = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		await user.click(screen.getByRole('button', { name: /undo/i }));
		expect((await undo).action).toEqual(
			expect.objectContaining({ id: '10', op: 'tag', tn: 'Urgent' })
		);
	});

	test('Undo calls back after the tag is applied again', async () => {
		createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const onUndo = vi.fn();
		const { result, user } = setupHook(useTagPillActions, {
			initialProps: [{ kind: 'message', ids: ['10'] }]
		});

		act(() => result.current.removeTag('Urgent', { onUndo }));
		const undoButton = await screen.findByRole('button', { name: /undo/i });
		const undo = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		await user.click(undoButton);
		await undo;

		await vi.waitFor(() => expect(onUndo).toHaveBeenCalledTimes(1));
	});

	test('an Undo that fails shows the error and does not call back', async () => {
		createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const onUndo = vi.fn();
		const { result, user } = setupHook(useTagPillActions, {
			initialProps: [{ kind: 'message', ids: ['10'] }]
		});

		act(() => result.current.removeTag('Urgent', { onUndo }));
		const undoButton = await screen.findByRole('button', { name: /undo/i });
		getSetupServer().use(http.post(MSG_ACTION_URL, () => HttpResponse.error()));
		await user.click(undoButton);

		expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
		expect(onUndo).not.toHaveBeenCalled();
	});

	test('removing a tag from a conversation sends !tag for the whole conversation', async () => {
		const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
		const { result } = setupHook(useTagPillActions, {
			initialProps: [{ kind: 'conversation', ids: ['20'] }]
		});

		act(() => result.current.removeTag('Client'));

		expect((await interceptor).action).toEqual(
			expect.objectContaining({ id: '20', op: '!tag', tn: 'Client' })
		);
	});

	test('a failed removal shows the error and calls back, without Undo', async () => {
		getSetupServer().use(
			http.post(MSG_ACTION_URL, () =>
				HttpResponse.json({ Body: { Fault: { Reason: { Text: 'no such tag' } } } })
			)
		);
		const onError = vi.fn();
		const { result } = setupHook(useTagPillActions, {
			initialProps: [{ kind: 'message', ids: ['10'] }]
		});

		act(() => result.current.removeTag('Urgent', { onError }));

		expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
		expect(onError).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument();
	});

	test('a removal that never reaches the server shows the error and calls back', async () => {
		getSetupServer().use(http.post(MSG_ACTION_URL, () => HttpResponse.error()));
		const onError = vi.fn();
		const { result } = setupHook(useTagPillActions, {
			initialProps: [{ kind: 'message', ids: ['10'] }]
		});

		act(() => result.current.removeTag('Urgent', { onError }));

		expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
		expect(onError).toHaveBeenCalledTimes(1);
	});

	test('toggling a tag applies or removes it without a snackbar', async () => {
		const apply = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const { result } = setupHook(useTagPillActions, {
			initialProps: [{ kind: 'message', ids: ['10'] }]
		});

		act(() => result.current.toggleTag('Personal', true));
		expect((await apply).action).toEqual(
			expect.objectContaining({ id: '10', op: 'tag', tn: 'Personal' })
		);

		const remove = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		act(() => result.current.toggleTag('Personal', false));
		expect((await remove).action).toEqual(
			expect.objectContaining({ id: '10', op: '!tag', tn: 'Personal' })
		);
		expect(screen.queryByText(/tag (removed|applied)/)).not.toBeInTheDocument();
	});

	test('a toggle the server refuses shows the error', async () => {
		getSetupServer().use(
			http.post(MSG_ACTION_URL, () =>
				HttpResponse.json({ Body: { Fault: { Reason: { Text: 'no such tag' } } } })
			)
		);
		const { result } = setupHook(useTagPillActions, {
			initialProps: [{ kind: 'message', ids: ['10'] }]
		});

		act(() => result.current.toggleTag('Personal', true));

		expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
	});
});
