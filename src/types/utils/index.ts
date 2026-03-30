/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Folder } from '@zextras/carbonio-ui-commons';

export type ModalProps = {
	folder: Folder;
	onClose: () => void;
};
