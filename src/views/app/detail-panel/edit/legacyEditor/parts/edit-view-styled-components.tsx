/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import styled from '@emotion/styled';
import { Container, IconCheckbox, PaletteColor, Row } from '@zextras/carbonio-design-system';

export const FileInput = styled.input`
	display: none;
`;

export const Divider = styled.div`
	width: 100%;
	min-height: 0.0625rem;
	max-height: 0.0625rem;
	border-bottom: 0.0625rem solid ${(props): string => props.theme.palette.gray2.regular};
`;

export const ResizedIconCheckbox = styled(IconCheckbox)`
	[class^='Padding__Comp'] {
		padding: 0.375rem;
		svg {
			height: 1.25rem;
			width: 1.25rem;
		}
	}
`;

export const TextArea = styled.textarea`
	box-sizing: border-box;
	min-height: 15.625rem;

	flex-grow: 1;
	width: 100%;
	border: none;
	resize: vertical;
	& :focus,
	:active {
		box-shadow: none;
		border: none;
		outline: none;
	}
`;

export const EditorWrapper = styled.div`
	width: 100%;

	.tox.tox-tinymce {
		width: 100%;
		height: 100%;
		border: none;
	}
`;

export const BannerContainer = styled(Container)<{
	$bottomBorderColor: PaletteColor;
}>`
	border-bottom: 0.0625rem solid
		${({ theme, $bottomBorderColor }): string => theme.palette[$bottomBorderColor].regular};
	border-top-right-radius: 0.25rem;
	border-top-left-radius: 0.25rem;
	padding: 1rem;
`;

export const RowContainer = styled(Container)`
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	grid-gap: 0.5rem;
	height: fit-content;
`;

export const ColContainer = styled.div<{ $occupyFull: boolean }>`
	grid-column: ${({ $occupyFull }): string => `span  ${$occupyFull ? 12 : 6}`};
`;

export const StickyTime = styled(Row)`
	position: relative;
	bottom: 2.375rem;
	right: -0.125rem;
`;

export const StickyTimeContainer = styled(Row)`
	position: sticky;
	bottom: 0.625rem;
	right: 0.625rem;
	height: 0;
`;
