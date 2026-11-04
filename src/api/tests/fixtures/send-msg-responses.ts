/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SoapSendMsgResponse } from 'types/soap/send-msg';

// SendMsg of a reply saved to Sent: only the id of the saved copy, never its conversation id
// (SendMsg.java:289-291 without fetchSavedMsg, a real response from the test server)
export const sendMsgSavedToSentResponse = {
	m: [{ id: '263' }],
	_jsns: 'urn:zimbraMail'
} satisfies SoapSendMsgResponse;

// SendMsg of an account with zimbraPrefSaveToSent FALSE: nothing is saved, so the m has no id
// (SendMsg.java:293-294, a real response from the test server)
export const sendMsgNotSavedResponse = {
	m: [{}],
	_jsns: 'urn:zimbraMail'
} satisfies SoapSendMsgResponse;
