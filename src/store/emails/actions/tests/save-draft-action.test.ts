/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shellHooks from '@zextras/carbonio-shell-ui';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { generateAccount } from '@test-utils/accounts/account-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateEditor } from 'store/editor/editor-generators';
import { saveDraftEmailStoreAction } from 'store/emails/actions/save-draft-action';
import { MailsEditorV2 } from 'types/editor';
import { SaveDraftRequest } from 'types/soap/save-draft';

describe('saveDraftEmailStoreAction', () => {
	describe('Reply-To', () => {
		const replyToAddress = 'replyTo@test.com';

		const identityId = '3b778c1d-529f-45b7-b131-5162c83551f7';
		const defaultIdentity = {
			id: identityId,
			name: 'DEFAULT',
			_attrs: {
				zimbraPrefReplyToEnabled: 'TRUE',
				zimbraPrefReplyToAddress: replyToAddress,
				zimbraPrefIdentityId: '3b778c1d-529f-45b7-b131-5162c83551f7'
			}
		} as shellHooks.Identity;
		const mainAccountAddress = 'default@test.com';
		const mainAccount: shellHooks.Account = {
			...generateAccount(),
			id: defaultIdentity.id,
			name: mainAccountAddress,
			displayName: 'default account',
			identities: { identity: [defaultIdentity] },
			rights: [] as never // cannot import AccountRights from carbonio-shell-ui
		};

		beforeEach(() => {
			vi.spyOn(shellHooks, 'getUserAccount').mockReturnValue(mainAccount);
		});

		it('should add reply-to participant when reply-to is set in Mails settings', async () => {
			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			const saveDraftRequestPromise = createSoapAPIInterceptor<SaveDraftRequest>('SaveDraft');

			await saveDraftEmailStoreAction({ editor });

			const sendMsgRequest = await saveDraftRequestPromise;
			const participants = sendMsgRequest.m.e;
			expect(participants).toEqual(
				expect.arrayContaining([
					{
						a: replyToAddress,
						t: ParticipantRole.REPLY_TO
					}
				])
			);
		});
	});
});
