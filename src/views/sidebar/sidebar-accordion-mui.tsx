/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Container from '@mui/material/Container';
import { Folder } from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback, useRef } from 'react';
import { useLocalStorage } from '../../hooks/use-local-storage';
import AccordionCustomComponent from './accordion-custom-component';
import { ButtonFindShares } from './button-find-shares';

export const SidebarAccordionMui: FC<{ accordions: Array<Folder>; folderId: string }> = ({
	accordions,
	folderId
}) => {
	const [openIds, setOpenIds] = useLocalStorage<Array<string>>('open_mails_folders', []);
	const sidebarRef = useRef<HTMLInputElement>(null);

	const onClick = useCallback(
		(accordion: Folder, expanded: boolean): void => {
			if (expanded) {
				setOpenIds((state: Array<string>) =>
					state.includes(accordion.id) ? state : [...state, accordion.id]
				);
			} else {
				setOpenIds((state: Array<string>) => state.filter((id) => id !== accordion.id));
			}
		},
		[setOpenIds]
	);

	return (
		<Container disableGutters sx={{ width: '100%' }}>
			{accordions.map((accordion) =>
				accordion.id === 'find_shares' ? (
					<ButtonFindShares />
				) : (
					<div key={accordion.id} ref={sidebarRef}>
						<Accordion
							disableGutters
							TransitionProps={{ unmountOnExit: true }}
							expanded={openIds.includes(accordion.id)}
						>
							<AccordionSummary
								expandIcon={
									accordion.children.length > 0 && (
										<ExpandMoreIcon
											color="primary"
											onClick={(e): void => {
												e.preventDefault();
												onClick(accordion, !openIds.includes(accordion.id));
											}}
										/>
									)
								}
								aria-controls="panel1a-content"
								id={accordion.id}
								sx={{
									backgroundColor: accordion.id === folderId ? '#d5e3f6' : '#f5f6f8',
									'&:hover': { backgroundColor: accordion.id === folderId ? '#abc7ed' : '#D7DBE3' }
								}}
							>
								<AccordionCustomComponent item={accordion} />
							</AccordionSummary>
							{accordion.children.length > 0 && (
								<AccordionDetails>
									<SidebarAccordionMui accordions={accordion.children} folderId={folderId} />
								</AccordionDetails>
							)}
						</Accordion>
					</div>
				)
			)}
		</Container>
	);
};
