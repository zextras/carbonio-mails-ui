/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { Container, Icon, Text, Padding } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const BackDropLayout = styled(Container)`
	width: 100%;
	position: absolute;
	height: 100%;
	z-index: 2;
	top: 0px;
	left: 0px;
`;

const DropBackground = styled(Container)`
	width: calc(100% - 10px);
	background: ${(props) => props.theme.palette.primary.regular}b9;
	height: calc(100% - 10px);
	border-radius: 4px;
	left: 5px;
	pointer-events: none;
`;
const BackDropLayoutInnerBox = styled(Container)`
	background: ${(props) => props.theme.palette.gray6.regular};
	border-radius: 10px;
	min-height: 180px;
	max-width: 380px;
	max-height: 210px;
`;

const BackDropLayoutContentBox = styled(Container)`
	border-style: dashed;
	border-width: 2px;
	border-radius: 5px;
	border-color: ${(props) => props.theme.palette.primary.regular};
	box-sizing: border-box;
	padding: 40px;
`;

const DropBoxIconGroup = styled(Container)`
	margin-bottom: 8px;
	height: 40px;
`;

const DetailText = styled(Text)`
	text-align: center;
`;

export default function DropZoneAttachment({ onDragOverEvent, onDropEvent, onDragLeaveEvent }) {
	const [t] = useTranslation();
	return (
		<>
			<BackDropLayout
				onDragOver={onDragOverEvent}
				onDrop={onDropEvent}
				onDragLeave={onDragLeaveEvent}
				borderRadius="half"
			>
				<DropBackground>
					<BackDropLayoutInnerBox>
						<Padding all="medium">
							<BackDropLayoutContentBox>
								<Container mainAlignment="center">
									<DropBoxIconGroup mainAlignment="center" orientation="horizontal">
										<Padding right="small" left="small">
											<Icon icon="ImageOutline" height="35px" width="35px" color="primary" />
										</Padding>
										<Padding right="small" left="small">
											<Icon icon="FileAddOutline" height="35px" width="35px" color="primary" />
										</Padding>
										<Padding right="small" left="small">
											<Icon icon="FilmOutline" height="35px" width="35px" color="primary" />
										</Padding>
									</DropBoxIconGroup>
									<Container mainAlignment="center" height="auto">
										<Text size="reguler" color="primary" weight="bold">
											{t('composer.attachment.drag_and_drop.title', 'Drag&Drop Mode')}
										</Text>
										<Padding top="small" />
										<DetailText
											size="medium"
											weight="regular"
											color="primary"
											overflow="break-word"
										>
											{t(
												'composer.attachment.drag_and_drop.content',
												'Drop here your attachments to quickly add them to this e-mail'
											)}
										</DetailText>
									</Container>
								</Container>
							</BackDropLayoutContentBox>
						</Padding>
					</BackDropLayoutInnerBox>
				</DropBackground>
			</BackDropLayout>
		</>
	);
}
