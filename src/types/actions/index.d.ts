/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ActionProps = {
	folder: Folder;
	grant: Grant;
	setActiveModal: (arg: string) => void;
	onMouseLeave: () => void;
	onMouseEnter: () => void;
};
