/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class DraftTrashedEvent extends CustomEvent<{ draftId: string }> {
	static readonly EventName = 'carbonio:mails:eventbus:draft-trashed';

	constructor(draftId: string) {
		super(DraftTrashedEvent.EventName, {
			detail: { draftId }
		});
	}
}
