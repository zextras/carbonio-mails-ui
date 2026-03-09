/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shellHooks from '@zextras/carbonio-shell-ui';
import { AvailableAddress, FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { LineType } from '../../commons/utils';
import { generateAccount } from '@test-utils/accounts/account-generator';
import { generateMessage } from '__test__/generators/generateMessage';
import { getAvailableAddresses } from 'helpers/get-available-addresses';
import {
	extractBody,
	generateReplyText,
	retrieveALL,
	retrieveCC,
	retrieveReplyTo
} from 'store/editor-slice-utils';
import { MailMessage } from 'types/messages';

vi.mock('../../helpers/get-available-addresses', () => ({
	getAvailableAddresses: vi.fn()
}));
const mailMessage: MailMessage = {
	attachments: undefined,
	autoSendTime: 0,
	body: {
		contentType: 'text/html',
		content: '<p>Hello from me!</p>',
		truncated: false
	},
	conversation: '',
	creationDateFromMailHeaders: '',
	date: 0,
	did: '',
	flagged: false,
	fragment: '',
	hasAttachment: false,
	id: '',
	invite: undefined,
	isComplete: false,
	isDeleted: false,
	isDraft: false,
	isEncrypted: false,
	isForwarded: false,
	isInvite: false,
	isReadReceiptRequested: false,
	isReplied: false,
	isScheduled: false,
	isSentByMe: false,
	messageIdFromMailHeaders: '',
	messageIsFromDistributionList: false,
	messageIsFromExternalDomain: false,
	originalId: '',
	parent: '',
	participants: [
		{
			type: 'f',
			address: 'sender@test.com'
		},
		{
			type: 't',
			address: 'toAddress1@test.com'
		},
		{
			type: 't',
			address: 'toAddress2@test.com',
			fullName: 'To Address 2'
		},
		{
			type: 'c',
			address: 'ccAddress1@test.com',
			fullName: 'CC Address 1'
		},
		{
			type: 'c',
			address: 'ccAddress2@test.com',
			fullName: 'CC Address 2'
		}
	],
	parts: [
		{
			contentType: 'text/html',
			size: 0,
			name: 'asdsa',
			content: '<p>Hello</p>'
		},
		{
			contentType: 'text/plain',
			size: 0,
			name: 'asdsa',
			content: 'Hello plain text'
		}
	],
	read: false,
	html: true,
	replyType: undefined,
	sensitivity: undefined,
	shr: undefined,
	signature: undefined,
	size: 0,
	subject: 'This is the subject',
	tags: [],
	urgent: false
};
describe('retrieveCC', () => {
	const defaultIdentity = {
		id: '3b778c1d-529f-45b7-b131-5162c83551f7',
		name: 'DEFAULT',
		_attrs: []
	} as shellHooks.Identity;

	const sendAsIdentityDisplayName = 'Homer Simpson';
	const delegatorAccountAddress = 'delegatoraccount@test.com';
	const sendAsIdentity = {
		id: '80c3aba1-f2e9-4492-9447-cabdbf08a2e8',
		name: 'sendAsIdentity',
		_attrs: [
			{
				zimbraPrefIdentityName: 'sendAsIdentity',
				zimbraPrefFromDisplay: sendAsIdentityDisplayName,
				zimbraPrefFromAddress: delegatorAccountAddress, // Delegator
				zimbraPrefFromAddressType: 'sendAs',
				zimbraPrefReplyToEnabled: 'FALSE'
			}
		]
	} as shellHooks.Identity;

	const accountRights = {
		targets: [
			{
				right: 'sendAs',
				target: [
					{
						id: sendAsIdentity.id,
						name: sendAsIdentityDisplayName,
						type: 'account',
						email: [{ addr: delegatorAccountAddress }],
						d: sendAsIdentityDisplayName
					}
				]
			}
		]
	};

	const mainAccount: shellHooks.Account = {
		...generateAccount(),
		id: defaultIdentity.id,
		name: 'default@test.com',
		displayName: 'default account',
		identities: { identity: [defaultIdentity, sendAsIdentity] },
		rights: accountRights as never // cannot import AccountRights from carbonio-shell-ui
	};

	const defaultIdentityForDelegator = {
		id: sendAsIdentity.id,
		name: 'DEFAULT',
		_attrs: []
	} as shellHooks.Identity;

	const delegatorAccount = {
		...generateAccount(),
		id: defaultIdentityForDelegator.id,
		email: delegatorAccountAddress,
		identities: { identity: [defaultIdentityForDelegator], rights: [] },
		name: delegatorAccountAddress,
		displayName: sendAsIdentityDisplayName
	};

	const externalUser = 'external@test.com';
	const anotherUser = 'userC@test.com';

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	// Scenario: The main account (who has "Send As" rights) starts a conversation and adds the delegator in CC.
	// Expected Behavior: On "Reply All," the delegator remains in CC.
	it('TC1: Main account sends an email, Delegator in CC', () => {
		vi.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: mainAccount.name },
			cc: [{ type: 'c', address: delegatorAccount.email }],
			to: []
		});

		expect(retrieveCC(message, mainAccount.name)).toEqual([
			{ type: 'c', address: delegatorAccount.email }
		]);
	});

	// Scenario: The delegator starts the conversation and includes the main account in CC.
	// Expected Behavior: On "Reply All," the main account remains in CC.
	it('TC2: Delegator sends an email, Main Account in CC', () => {
		vi.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => delegatorAccount)
			.mockImplementationOnce(() => mainAccount);

		const message = generateMessage({
			from: { type: 'f', address: delegatorAccount.email },
			cc: [{ type: 'c', address: mainAccount.name }],
			to: []
		});

		expect(retrieveCC(message, delegatorAccount.email)).toEqual([
			{ type: 'c', address: mainAccount.name }
		]);
	});

	// Scenario: The main account sends an email using "Send As" permissions for the delegator, while also including the delegator in CC.
	// Expected Behavior: On "Reply All," only Main account remains in CC.
	it('TC3: Main Account sends as Delegator, Delegator in CC', () => {
		vi.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: delegatorAccount.email },
			cc: [
				{ type: 'c', address: delegatorAccount.email },
				{ type: 'c', address: mainAccount.name }
			],
			to: []
		});

		expect(retrieveCC(message, delegatorAccount.email)).toEqual([
			{ type: 'c', address: mainAccount.name }
		]);
	});

	// Scenario: The main account sends an email on behalf of the delegator but does not include the delegator in CC.
	// Expected Behavior: On "Reply All," the delegator should not be automatically added to CC.
	it('TC4: Main Account sends as Delegator, Delegator NOT in CC', () => {
		vi.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: delegatorAccount.email },
			cc: [],
			to: []
		});

		expect(retrieveCC(message, delegatorAccount.email)).toEqual([]);
	});

	// Scenario: An external user replies to the email thread where both the main account and delegator were in CC.
	// Expected Behavior: On "Reply All," both remain in CC.
	it('TC5: External user replies to conversation with Main Account & Delegator in CC', () => {
		vi.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: externalUser },
			cc: [
				{ type: 'c', address: mainAccount.name },
				{ type: 'c', address: delegatorAccount.email }
			],
			to: []
		});

		expect(retrieveCC(message, externalUser)).toEqual([
			{ type: 'c', address: mainAccount.name },
			{ type: 'c', address: delegatorAccount.email }
		]);
	});

	// Scenario: The main account sends an email using "Send As" for the delegator and includes a third party (User C) in CC.
	// Expected Behavior: On "Reply All," Main Account, User C remain in CC.
	it('TC6: Main Account sends as Delegator, Another Account in CC', () => {
		vi.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: delegatorAccount.email },
			cc: [
				{ type: 'c', address: anotherUser },
				{ type: 'c', address: mainAccount.name },
				{ type: 'c', address: delegatorAccount.email }
			],
			to: []
		});

		expect(retrieveCC(message, delegatorAccount.email)).toEqual([
			{ type: 'c', address: anotherUser },
			{ type: 'c', address: mainAccount.name }
		]);
	});
});

describe('retrieveALL', () => {
	const meAddress = 'me@test.com';
	const sharedAccount = 'sharedAccount@test.com';

	beforeEach(() => {
		const primaryAddress: AvailableAddress = {
			address: meAddress,
			type: 'primary',
			ownerAccount: meAddress
		};
		const sharedAccountAddress: AvailableAddress = {
			address: sharedAccount,
			type: 'delegation',
			ownerAccount: sharedAccount
		};

		(getAvailableAddresses as Mock).mockReturnValue([primaryAddress, sharedAccountAddress]);
	});
	it('should return "someone@test.com" when replying as Me to a message sent to me from "someone@test.com"', () => {
		const receivedMessage = {
			...generateMessage(),
			participants: [
				{ type: ParticipantRole.FROM, address: 'someone@test.com' },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};
		const result = retrieveALL(receivedMessage, meAddress);

		expect(result).toEqual([{ address: 'someone@test.com', type: 't' }]);
	});

	it('should return "me@test.com" when replying as Me to a message sent to myself when in INBOX folder', () => {
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.INBOX,
			participants: [
				{ type: ParticipantRole.FROM, address: meAddress },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};
		const result = retrieveALL(receivedMessage, meAddress);

		expect(result).toEqual([{ address: meAddress, type: 't' }]);
	});

	it.skip('should return "me@test.com" when replying as Me to a message sent to myself when in SENT folder', () => {
		// FIXME: failing
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.SENT,
			participants: [
				{ type: ParticipantRole.FROM, address: meAddress },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};

		const result = retrieveALL(receivedMessage, meAddress);

		expect(result).toEqual([{ address: meAddress, type: 't' }]);
	});

	it('should return [Me and "someoneElse"] in To when replying as "sharedAccount" to a message sent by Me To "someoneElse" and "sharedAccount" is in CC', () => {
		const me = meAddress;
		const someoneElse = 'someoneElse@test.com';
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.SENT,
			participants: [
				{ type: ParticipantRole.FROM, address: me },
				{ type: ParticipantRole.TO, address: someoneElse },
				{ type: ParticipantRole.CARBON_COPY, address: sharedAccount }
			]
		};
		const replyMessageRecipients = retrieveALL(receivedMessage, sharedAccount);

		expect(replyMessageRecipients).toEqual([
			{ address: me, type: 't' },
			{ address: someoneElse, type: 't' }
		]);
	});

	it.skip('should remove the sender when it was in the recipients of the original message', () => {
		// FIXME: failing
		const me = meAddress;
		const someoneElse = 'someoneElse@test.com';
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.SENT,
			participants: [
				{ type: ParticipantRole.FROM, address: me },
				{ type: ParticipantRole.TO, address: someoneElse },
				{ type: ParticipantRole.TO, address: sharedAccount }
			]
		};
		const replyMessageRecipients = retrieveALL(receivedMessage, sharedAccount);

		expect(replyMessageRecipients).toEqual([
			{ address: me, type: 't' },
			{ address: someoneElse, type: 't' }
		]);
	});

	it('should return someone@test.com (original sender) in the TO when replying to all, moves the rest of the participants to the CC', () => {
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.INBOX,
			participants: [
				{ type: ParticipantRole.FROM, address: 'someone@test.com' },
				{ type: ParticipantRole.TO, address: sharedAccount },
				{ type: ParticipantRole.TO, address: 'another@test.com' }
			]
		};
		const replyMessageRecipients = retrieveALL(receivedMessage, meAddress);
		const ccMessageRecipients = retrieveCC(receivedMessage, meAddress);
		expect(replyMessageRecipients).toEqual([
			{
				address: 'someone@test.com',
				type: 't'
			}
		]);
		expect(ccMessageRecipients).toEqual([
			{
				address: 'sharedAccount@test.com',
				type: 'c'
			},
			{
				address: 'another@test.com',
				type: 'c'
			}
		]);
	});
});

describe('retrieveReplyTo', () => {
	const meAddress = 'me@test.com';
	it('should return "me@test.com" when replying as Me to a message sent to myself', () => {
		vi.clearAllMocks();
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.SENT,
			participants: [
				{ type: ParticipantRole.FROM, address: meAddress },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};
		const result = retrieveReplyTo(receivedMessage);

		expect(result).toEqual([{ address: meAddress, type: 't' }]);
	});

	describe('generateReplyText', () => {
		const labels = {
			cc: 'CC_LABEL:',
			from: 'FROM_LABEL:',
			sent: 'SENT_LABEL:',
			subject: 'SUBJECT_LABEL:',
			to: 'TO_LABEL:'
		};
		describe('richText handling', () => {
			it('should return SUBJECT in bold and original message subject', () => {
				const { richText } = generateReplyText(mailMessage, labels);
				expect(richText).toContain(`<b>${labels.subject}</b> ${mailMessage.subject}`);
			});

			it('should return FROM label in bold and original message sender full name and address', () => {
				const { richText } = generateReplyText(mailMessage, labels);
				expect(richText).toContain(`<b>${labels.from}</b> "undefined" &lt;sender@test.com&gt;`);
			});

			it('should return SENT label in bold and original message date', () => {
				const { richText } = generateReplyText(mailMessage, labels);
				expect(richText).toContain(`<b>${labels.sent}</b>`);
			});

			it('should return TO label in bold and original message to addresses', () => {
				const { richText } = generateReplyText(mailMessage, labels);
				expect(richText).toContain(
					`<b>${labels.to}</b> "undefined" &lt;toAddress1@test.com&gt;, "To Address 2" &lt;toAddress2@test.com&gt;`
				);
			});

			it('should display TO address with fullname when present (no undefined)', () => {
				const { richText } = generateReplyText(mailMessage, labels);
				expect(richText).toContain(`"To Address 2" &lt;toAddress2@test.com&gt;`);
			});

			it('should generate reply without extra line breaks before quoted text', () => {
				const { richText } = generateReplyText(mailMessage, labels);
				expect(richText.startsWith('<hr id="zwchr" >')).toBeTruthy();
			});
		});

		describe('plainText handling', () => {
			it('should return SUBJECT and original message subject', () => {
				const { plainText } = generateReplyText(mailMessage, labels);
				expect(plainText).toContain(`${labels.subject} ${mailMessage.subject}`);
			});

			it('should return FROM label and original message sender full name and address', () => {
				const { plainText } = generateReplyText(mailMessage, labels);
				expect(plainText).toContain(`${labels.from} "undefined" <sender@test.com>`);
			});

			it('should return SENT label and original message date', () => {
				const { plainText } = generateReplyText(mailMessage, labels);
				expect(plainText).toContain(`${labels.sent}`);
			});

			it('should return TO label and original message to addresses', () => {
				const { plainText } = generateReplyText(mailMessage, labels);
				expect(plainText).toContain(
					`${labels.to} "undefined" <toAddress1@test.com>, "To Address 2" <toAddress2@test.com>`
				);
			});

			it('should return CC label and original message cc addresses', () => {
				const { plainText } = generateReplyText(mailMessage, labels);
				expect(plainText).toContain(
					`${labels.cc} "CC Address 1" <ccAddress1@test.com>, "CC Address 2" <ccAddress2@test.com>`
				);
			});

			it('should display TO address with fullname when present (no undefined)', () => {
				const { plainText } = generateReplyText(mailMessage, labels);
				expect(plainText).toContain(`"To Address 2" <toAddress2@test.com>`);
			});

			it('should generate reply without extra line breaks before quoted text', () => {
				const { plainText } = generateReplyText(mailMessage, labels);
				expect(plainText.startsWith(`${LineType.PLAINTEXT_SEP}`)).toBeTruthy();
			});

			it('should add two line breaks after the quoted text separator(PLAINTEXT_SEP)', () => {
				const { plainText } = generateReplyText(mailMessage, labels);
				expect(plainText.startsWith(`${LineType.PLAINTEXT_SEP}\n\n${labels.from}`)).toBeTruthy();
			});
		});
	});

	describe('extractBody', () => {
		describe('HTML', () => {
			it('html should return html message', () => {
				const htmlContent = '<div><p>Hello there </p></div>';
				const message: MailMessage = {
					...mailMessage,
					parts: [
						{
							contentType: 'text/html',
							size: 0,
							content: htmlContent,
							name: 'HTML body'
						}
					]
				};
				const extractedBody = extractBody(message);
				const html = extractedBody.richText;
				expect(html).toEqual(htmlContent);
			});
			it('html should return plain text if no html', () => {
				const plainText = 'Plain boring text';
				const message: MailMessage = {
					...mailMessage,
					parts: [
						{
							contentType: 'text/plain',
							size: 0,
							content: plainText,
							name: 'Plain body'
						}
					]
				};
				const extractedBody = extractBody(message);
				const html = extractedBody.richText;
				expect(html).toEqual(plainText);
			});
			it('should replace dfsrc with src in html message', () => {
				const htmlContent = '<div>dfsrc<p>Hello there </p></div>';
				const message: MailMessage = {
					...mailMessage,
					parts: [
						{
							contentType: 'text/html',
							size: 0,
							content: htmlContent,
							name: 'HTML body'
						}
					]
				};
				const extractedBody = extractBody(message);
				const html = extractedBody.richText;
				expect(html).toEqual(`<div>src<p>Hello there </p></div>`);
			});
		});
		describe('Plain text', () => {
			it('plain should return plain message', () => {
				const plainText = 'Plain boring text';
				const message: MailMessage = {
					...mailMessage,
					parts: [
						{
							contentType: 'text/plain',
							size: 0,
							content: plainText,
							name: 'Plain body'
						}
					]
				};
				const extractedBody = extractBody(message);
				const plain = extractedBody.plainText;
				expect(plain).toEqual(plainText);
			});
			it('should replace \r and \r\n with \n in plain text', () => {
				const plainText = 'Plain \r\n boring \r text';
				const message: MailMessage = {
					...mailMessage,
					parts: [
						{
							contentType: 'text/plain',
							size: 0,
							content: plainText,
							name: 'Plain body'
						}
					]
				};
				const extractedBody = extractBody(message);
				const plain = extractedBody.plainText;
				expect(plain).toEqual('Plain \n boring \n text');
			});
			it('plain should return html if no plain text', () => {
				const htmlBody = '<p>Hello</p>';
				const message: MailMessage = {
					...mailMessage,
					parts: [
						{
							contentType: 'text/html',
							size: 0,
							content: htmlBody,
							name: 'HTML body'
						}
					]
				};
				const extractedBody = extractBody(message);
				const plain = extractedBody.plainText;
				expect(plain).toEqual(htmlBody);
			});
			it('should return empty string if no plain text', () => {
				const message: MailMessage = {
					...mailMessage,
					parts: []
				};
				const extractedBody = extractBody(message);
				const plain = extractedBody.plainText;
				const html = extractedBody.richText;
				expect(plain).toEqual('');
				expect(html).toEqual('');
			});
		});
	});
});
