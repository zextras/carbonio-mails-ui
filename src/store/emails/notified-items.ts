/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * The items (messages and conversations) notified while a search is in progress: the notifications are newer
 * than its results, which must not bring back the deleted items nor overwrite the changed ones.
 */
export type NotifiedItems = {
	deletedIds: Set<string>;
	changedIds: Set<string>;
};

const trackedSearches = new Set<NotifiedItems>();

/**
 * Starts recording the notified items, until the returned `stop` is called.
 */
export function trackNotifiedItems(): { notifiedItems: NotifiedItems; stop: () => void } {
	const notifiedItems: NotifiedItems = { deletedIds: new Set(), changedIds: new Set() };
	trackedSearches.add(notifiedItems);
	return {
		notifiedItems,
		stop: (): void => {
			trackedSearches.delete(notifiedItems);
		}
	};
}

export function recordNotifiedItems({
	deletedIds,
	changedIds
}: {
	deletedIds: Array<string>;
	changedIds: Array<string>;
}): void {
	trackedSearches.forEach((notifiedItems) => {
		deletedIds.forEach((id) => notifiedItems.deletedIds.add(id));
		changedIds.forEach((id) => notifiedItems.changedIds.add(id));
	});
}
