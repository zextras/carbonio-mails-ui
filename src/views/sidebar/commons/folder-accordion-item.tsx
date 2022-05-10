/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useState } from 'react';
import { AccordionItem } from '@zextras/carbonio-design-system';
import { AccordionFolder, FOLDERS, useUserAccount } from '@zextras/carbonio-shell-ui';
import { useHistory } from 'react-router-dom';
import { isEmpty, startsWith } from 'lodash';
import { getFolderIconColor, getFolderIconName } from '../utils';

export type CustomComponentProps = {
	item: AccordionFolder;
	searchString: string;
};

const FolderAccordionItem: FC<CustomComponentProps> = ({ item, searchString }) => {
	const { folder } = item;
	const [folderDestination, setFolderDestination] = useState(folder);
	const history = useHistory();
	const activeFolder = history?.location?.pathname?.split?.('/')?.[3];
	const accountName = useUserAccount().name;

	const accordionItem = {
		...folder,
		onClick: () => setFolderDestination(folder),
		divider: true,
		background: folderDestination.id === folder.id ? 'highlight' : undefined,
		label: item.id === FOLDERS.USER_ROOT ? accountName : item.label,
		icon: getFolderIconName(item),
		iconColor: getFolderIconColor(item),
		activeId: item.id === activeFolder
	};
	const filteredFolder: boolean =
		!isEmpty(searchString) && accordionItem.label
			? startsWith(item.label.toLowerCase(), searchString.toLowerCase())
			: false;

	return <>{filteredFolder ?? <AccordionItem item={accordionItem} />}</>;
};

export default FolderAccordionItem;
