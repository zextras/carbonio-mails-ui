/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ThemeProvider } from '@mui/material';
import { Folder, useFoldersByView } from '@zextras/carbonio-shell-ui';
import { Accordion, Container, Divider } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { FC, useMemo } from 'react';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
import { FOLDER_VIEW } from '../../constants';
import useGetTagsAccordion from '../../hooks/use-get-tags-accordions';
import { themeMui } from '../../theme/theme-mui';
import CollapsedSideBarItems from './collapsed-sidebar-items';
import { SidebarAccordionMui } from './sidebar-accordion-mui';

type SidebarComponentProps = {
	accordions: Array<Folder>;
};

const SidebarComponent: FC<SidebarComponentProps> = ({ accordions }) => {
	const { folderId } = useParams<{ folderId: string }>();
	const tagsAccordionItems = useGetTagsAccordion();

	const accordionsWithFindShare = useMemo(() => {
		if (!accordions?.[0]?.children.find((folder) => folder.id === 'find_shares')) {
			accordions[0]?.children?.push({
				id: 'find_shares',
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				disableHover: true
			});
		}
		return map(accordions, (item) => ({ ...item, background: 'gray4' }));
	}, [accordions]);
	return (
		<Container orientation="vertical" height="fit" width="fill">
			<SidebarAccordionMui accordions={accordionsWithFindShare} folderId={folderId} />
			<Divider />
			<Accordion items={[tagsAccordionItems]} />
		</Container>
	);
};

type SidebarProps = {
	expanded: boolean;
};

const MemoSidebar: FC<SidebarComponentProps> = React.memo(SidebarComponent);

const Sidebar: FC<SidebarProps> = ({ expanded }) => {
	const { path } = useRouteMatch();
	const accordions = useFoldersByView(FOLDER_VIEW.message);
	return (
		<>
			<ThemeProvider theme={themeMui}>
				{expanded ? (
					<Switch>
						<Route path={`${path}/folder/:folderId/:type?/:itemId?`}>
							<MemoSidebar accordions={accordions} />
						</Route>
					</Switch>
				) : (
					accordions[0].children.map((folder) => (
						<CollapsedSideBarItems key={folder.id} folder={folder} />
					))
				)}
			</ThemeProvider>
		</>
	);
};

export default Sidebar;
