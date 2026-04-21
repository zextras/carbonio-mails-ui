/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class QuotaChangedEvent extends CustomEvent<undefined> {
	static readonly EventName = 'carbonio:mails:eventbus:quota-changed';

	constructor() {
		super(QuotaChangedEvent.EventName);
	}
}
