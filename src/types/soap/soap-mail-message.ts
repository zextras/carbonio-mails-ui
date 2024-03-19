/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SoapMailParticipant } from './soap-mail-participant';

export type SoapIncompleteMessage = {
	readonly id: string;
	/** Conversation id */ cid: string;
	/** Message id */ mid?: string;
	/** Folder id */ l: string;
	/** Size */ s: number;
	/** Date */ d: number;
	/** Send date */ sd?: number;
	/** Revision */ rev?: number;
	// Flags. (u)nread, (f)lagged, has (a)ttachment, (r)eplied, (s)ent by me,
	// for(w)arded, calendar in(v)ite, (d)raft, IMAP-\Deleted (x), (n)otification sent,
	// urgent (!), low-priority (?), priority (+)
	/** Flags */ f?: string;
	/** TagNames */ tn?: string;
	/** TagIds */ t?: string;
	/** Subject */ su?: string;
	/** Fragment */ fr?: string;
	/** Contacts */ e?: Array<SoapMailParticipant>;
	/** Parts */ mp?: Array<SoapMailMessagePart>;
	/** Scheduled time */ autoSendTime?: number;
	/** Invite */ inv?: Array<any>;
	/** Shared */ shr?: Array<any>;
};

export type SoapMailMessage = SoapIncompleteMessage & {
	/** Contacts */ e: Array<SoapMailParticipant>;
	/** Subject */ su: string;
	/** Fragment */ fr: string;
	/** Parts */ mp: Array<SoapMailMessagePart>;
};

export type SoapMailMessagePart = {
	part: string;
	/**	Content Type  */ ct: 'multipart/alternative' | string;
	/**	Size  */ s?: number;
	/**	Content id (for inline images)  */ ci?: string;
	/** Content disposition */ cd?: 'inline' | 'attachment';
	/**	Parts  */ mp?: Array<SoapMailMessagePart>;
	/**	Set if is the body of the message  */ body?: true;
	filename?: string;
	// FIXME see IRIS-4029 Based on the compose settings the content could be a string or an object of type { _content: string }
	content?: string;
	requiresSmartLinkConversion?: boolean;
};
