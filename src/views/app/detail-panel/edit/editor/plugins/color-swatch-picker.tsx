/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { HexColorInput, HexColorPicker } from 'react-colorful';

const DEFAULT_COLOR = '#000000';

const StyledHexInput = styled(HexColorInput)`
	flex: 1 1 auto;
	min-width: 0;
	height: 1.75rem;
	box-sizing: border-box;
	padding: 0 0.5rem;
	border: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	border-radius: 0.125rem;
	font-size: 0.875rem;
	color: ${({ theme }): string => theme.palette.text.regular};
	background: ${({ theme }): string => theme.palette.gray6.regular};

	&:focus {
		outline: none;
		border-color: ${({ theme }): string => theme.palette.primary.regular};
	}
`;

const SwatchGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(5, 1.5rem);
	gap: 0.375rem;
`;

const Swatch = styled.button<{ $color: string }>`
	width: 1.5rem;
	height: 1.5rem;
	box-sizing: border-box;
	padding: 0;
	cursor: pointer;
	border-radius: 50%;
	border: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	background-color: ${({ $color }): string => $color};

	&:hover {
		box-shadow: 0 0 0 0.125rem ${({ theme }): string => theme.palette.highlight.regular};
	}
`;

// react-colorful ships its own required CSS (layout, gradients, the handle
// circle) by injecting a <style> tag at runtime rather than as CSS-in-JS.
// Carbonio Shell's CSP blocks that dynamically-created stylesheet, so the
// gradient/hue sliders would otherwise render with no size or background at
// all. Reproduce the rules it needs here instead, through emotion's own
// (CSP-approved) style injection, which the rest of this component already
// relies on.
const GradientContainer = styled.div`
	width: 100%;
	.react-colorful {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 9rem;
		cursor: default;
		user-select: none;
	}

	.react-colorful__saturation {
		position: relative;
		flex-grow: 1;
		border-radius: 0.125rem 0.125rem 0 0;
		background-image:
			linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, hsla(0, 0%, 100%, 0));
		border-bottom: 1px solid #000;
	}

	.react-colorful__hue {
		position: relative;
		height: 1rem;
		margin-top: 0.5rem;
		border-radius: 0.125rem;
		background: linear-gradient(
			90deg,
			red 0,
			#ff0 17%,
			#0f0 33%,
			#0ff 50%,
			#00f 67%,
			#f0f 83%,
			red
		);
	}

	.react-colorful__interactive {
		position: absolute;
		inset: 0;
		outline: none;
		touch-action: none;
	}

	.react-colorful__pointer {
		position: absolute;
		z-index: 1;
		box-sizing: border-box;
		width: 1.125rem;
		height: 1.125rem;
		transform: translate(-50%, -50%);
		background-color: #fff;
		border: 0.125rem solid #fff;
		border-radius: 50%;
		box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.2);
	}

	.react-colorful__saturation-pointer {
		z-index: 3;
	}

	.react-colorful__hue-pointer {
		z-index: 2;
	}
`;

export type ColorSwatchPickerProps = {
	color: string;
	onChange: (color: string) => void;
	/**
	 * Called once a color choice is complete — a preset swatch is clicked, or
	 * a drag on the saturation square ends (mouseup/touchend) — so the host
	 * popover can close itself and hand focus straight back to the editor.
	 * Not called while typing into the hex field, mid-drag on the saturation
	 * square, or for the hue strip at all: hue alone only rotates which
	 * column of the gradient square is available, it isn't a complete color
	 * choice by itself, so closing on it would cut the user off before they
	 * pick an actual shade.
	 */
	onColorCommit: () => void;
};

/**
 * Hex field + preset swatches + saturation/hue gradient picker, modeled after
 * Lexical's own playground color picker. Built entirely from non-form elements
 * (buttons, react-colorful's div-based sliders) other than the hex field, so
 * picking a color never steals the editor's DOM selection/focus the way the
 * native `<input type="color">` it replaces used to. The caret stays visible
 * and typing keeps working normally in the editor the whole time this picker
 * is open; the host popover also closes when the user clicks into the editor
 * (see `ColorPickerToolbarButton` in `rich-toolbar-plugin.tsx`).
 */
export const ColorSwatchPicker = ({
	color,
	onChange,
	onColorCommit
}: ColorSwatchPickerProps): React.JSX.Element => {
	const [hexColor, setHexColor] = useState(color || DEFAULT_COLOR);
	// Tracks a mousedown/touchstart that began specifically on the saturation
	// square — not the hue strip — so the matching mouseup/touchend (which can
	// land anywhere; dragging a handle regularly ends outside the slider's own
	// bounds) is recognized as "the color choice is complete" rather than some
	// unrelated pointer-up elsewhere. Adjusting hue alone isn't a complete
	// choice yet: hue only rotates which column of the gradient square is
	// available, the user still has to pick a shade in it afterward, so
	// closing on a hue-only interaction would cut that step short.
	const isPickingShadeRef = useRef(false);

	useEffect(() => {
		setHexColor(color || DEFAULT_COLOR);
	}, [color]);

	useEffect(() => {
		const handlePointerUp = (): void => {
			if (isPickingShadeRef.current) {
				isPickingShadeRef.current = false;
				onColorCommit();
			}
		};
		document.addEventListener('mouseup', handlePointerUp);
		document.addEventListener('touchend', handlePointerUp);
		return (): void => {
			document.removeEventListener('mouseup', handlePointerUp);
			document.removeEventListener('touchend', handlePointerUp);
		};
	}, [onColorCommit]);

	const handleChange = (nextColor: string): void => {
		setHexColor(nextColor);
		onChange(nextColor);
	};

	const handleGradientPointerDown = (event: React.MouseEvent | React.TouchEvent): void => {
		if ((event.target as Element).closest('.react-colorful__saturation')) {
			isPickingShadeRef.current = true;
		}
	};

	return (
		<Container
			width="12.5rem"
			height="fit"
			gap="0.5rem"
			padding={{ all: 'small' }}
			data-testid="color-swatch-picker"
		>
			<Container
				orientation="horizontal"
				gap="0.5rem"
				width="fill"
				mainAlignment="flex-start"
				crossAlignment="center"
			>
				<Container width="fit" height="fit">
					<Text size="small">{t('lexical-label.hex', 'Hex')}</Text>
				</Container>
				<StyledHexInput
					color={hexColor}
					onChange={handleChange}
					prefixed
					data-testid="color-swatch-picker-hex-input"
				/>
			</Container>
			<SwatchGrid>
				{ZIMBRA_STANDARD_COLORS.map(({ hex, zLabel }) => (
					<Swatch
						key={hex}
						type="button"
						$color={hex}
						aria-label={zLabel}
						data-testid={`color-swatch-${zLabel}`}
						// Keep the editor selection while picking a preset color.
						onMouseDown={(event): void => event.preventDefault()}
						onClick={(): void => {
							handleChange(hex);
							onColorCommit();
						}}
					/>
				))}
			</SwatchGrid>
			<GradientContainer
				onMouseDown={handleGradientPointerDown}
				onTouchStart={handleGradientPointerDown}
			>
				<HexColorPicker color={hexColor} onChange={handleChange} />
			</GradientContainer>
		</Container>
	);
};
