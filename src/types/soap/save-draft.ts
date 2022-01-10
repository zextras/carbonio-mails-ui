/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ParticipantRole } from '../participant';
import { SoapMailMessage } from './soap-mail-message';

export type mailAttachmentParts = {
	mid: string;
	part: string;
};

export type mailAttachment = {
	mp: Array<mailAttachmentParts>;
	aid?: string;
};

export type SoapEmailMessagePartObj = {
	part?: string;
	/**	Content Type  */ ct: 'multipart/alternative' | string;
	/**	Size  */ s?: number;
	/**	Content id (for inline images)  */ ci?: string;
	/** Content disposition */ cd?: 'inline' | 'attachment';
	/**	Parts  */ mp?: Array<SoapEmailMessagePartObj>;
	/**	Set if is the body of the message  */ body?: true;
	filename?: string;
	content?: { _content: string };
};

export type SoapEmailInfoObj = {
	/** Address */
	a: string;
	/** Display name */
	d?: string;
	t: ParticipantRole;
	isGroup?: 0 | 1;
};

export type SoapDraftMessageObj = {
	id?: string;
	attach: mailAttachment;
	su: { _content: string };
	mp: Array<SoapEmailMessagePartObj>;
	e: Array<SoapEmailInfoObj>;
	f?: string;
	did?: string;
};

export type SaveDraftRequest = {
	_jsns: 'urn:zimbraMail';
	m: SoapDraftMessageObj;
};

export type SaveDraftResponse = {
	m: Array<SoapMailMessage>;
};
