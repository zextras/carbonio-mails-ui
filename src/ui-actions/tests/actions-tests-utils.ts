/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ActionReturnType } from '../../types';

/**
 * Find and returns the valid action with the given id. If no action is found <code>null</code> is returned.
 *
 * @param id
 * @param actions
 */
const findActionById = (
	id: string,
	actions: Array<ActionReturnType>
): Exclude<ActionReturnType, false> | null => {
	if (!id || !actions || !actions.length) {
		return null;
	}

	const result = actions.reduce((previousValue, action) => {
		if (!action) {
			return previousValue;
		}

		if (action.id === id) {
			return action;
		}

		return previousValue;
	}, false);

	return result || null;
};

/**
 *
 * @param id
 * @param actions
 */
const existsActionById = (id: string, actions: Array<ActionReturnType>): boolean =>
	findActionById(id, actions) !== null;

export { findActionById, existsActionById };
