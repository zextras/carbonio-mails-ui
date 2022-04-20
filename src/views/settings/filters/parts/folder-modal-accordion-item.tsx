/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';
import { AccordionItem } from '@zextras/carbonio-design-system';
import { filter, isEmpty, startsWith } from 'lodash';
import { Folder, FOLDERS, getUserAccount } from '@zextras/carbonio-shell-ui';
import { getFolderIconColor, getFolderIconName } from '../../../sidebar/utils';

type CustomComponentProps = {
	item: {
		folder: Folder;
		items: Array<any>;
		label: string;
		id: string;
	};
	setFolderDestination: (arg: any) => void;
	input: string;
};
const FolderModalAccordionItem: FC<CustomComponentProps> = ({ item }) => (
	<AccordionItem item={item} />
);
export default FolderModalAccordionItem;
