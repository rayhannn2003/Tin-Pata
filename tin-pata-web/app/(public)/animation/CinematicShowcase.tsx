'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './animation.module.css';

const SCENE_DURATION = 9000;

const scenes = [
  {
    id: 'quiet-wild',
    titleLineOne: 'The Quiet',
    titleLineTwo: 'Wild',
    genre: 'Fantasy · Adventure',
    year: '2026',
    runtime: '1h 48m',
    rating: 'PG',
    description:
      'In a forest too busy to listen, one impossible flight awakens a world hidden in plain sight.',
    image: '/animation/quiet-wild.gif',
    position: 'center center',
  },
  {
    id: 'verdant-mile',
    titleLineOne: 'The Verdant',
    titleLineTwo: 'Mile',
    genre: 'Adventure · Drama',
    year: '2026',
    runtime: '1h 56m',
    rating: 'PG',
    description:
      'Across a rain-washed frontier, an unlikely pair discovers that courage begins where the map ends.',
    image: '/animation/verdant-mile.gif',
    position: 'center center',
  },
  {
    id: 'beyond-blackwater',
    titleLineOne: 'Beyond',
    titleLineTwo: 'Blackwater',
    genre: 'Fantasy · Adventure',
    year: '2026',
    runtime: '2h 12m',
    rating: 'PG-13',
    description:
      'With the horizon closing and old debts rising, a wayward captain wagers everything on one final tide.',
    image: '/animation/beyond-blackwater.gif',
    position: 'center center',
  },
] as const;

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.buttonIcon}>
      <path d="M8.3 5.6v12.8L18 12 8.3 5.6Z" fill="currentColor" />
    </svg>
  );
}

function PlusIcon({ checked }: { checked: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.buttonIcon}>
      {checked ? (
        <path
          d="m5.2 12.4 4.1 4.1 9.5-9.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      ) : (
        <path
          d="M12 5v14M5 12h14"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      )}
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={direction === 'left' ? styles.arrowLeft : styles.arrowRight}
    >
      <path
        d="m9 5 7 7-7 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function CinematicShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [savedScenes, setSavedScenes] = useState<Set<string>>(() => new Set());
  const dialogRef = useRef<HTMLDialogElement>(null);

  const activeScene = scenes[activeIndex] ?? scenes[0];
  const isSaved = savedScenes.has(activeScene.id);

  const stepScene = useCallback((direction: number) => {
    setActiveIndex((current) => (current + direction + scenes.length) % scenes.length);
    setCycle((current) => current + 1);
  }, []);

  const selectScene = useCallback((index: number) => {
    setActiveIndex(index);
    setCycle((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isPlaying || isTrailerOpen) return;

    const timeout = window.setTimeout(() => stepScene(1), SCENE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, isPlaying, isTrailerOpen, stepScene]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const respectMotionPreference = () => {
      if (reducedMotion.matches) setIsPlaying(false);
    };

    respectMotionPreference();
    reducedMotion.addEventListener('change', respectMotionPreference);
    return () => reducedMotion.removeEventListener('change', respectMotionPreference);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTrailerOpen) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepScene(-1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepScene(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTrailerOpen, stepScene]);

  const toggleSaved = () => {
    setSavedScenes((current) => {
      const next = new Set(current);
      if (next.has(activeScene.id)) next.delete(activeScene.id);
      else next.add(activeScene.id);
      return next;
    });
  };

  const togglePlayback = () => {
    setIsPlaying((current) => !current);
    setCycle((current) => current + 1);
  };

  const openTrailer = () => {
    setIsTrailerOpen(true);
    setCycle((current) => current + 1);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  };

  const closeTrailer = () => dialogRef.current?.close();

  return (
    <main className={styles.showcase} data-scene={activeIndex}>
      <div className={styles.scenes} aria-hidden="true">
        {scenes.map((scene, index) => (
          <div
            className={`${styles.scene} ${index === activeIndex ? styles.sceneActive : ''}`}
            key={scene.id}
          >
            <div
              className={styles.sceneImage}
              style={{
                backgroundImage: `url("${scene.image}")`,
                backgroundPosition: scene.position,
              }}
            />
          </div>
        ))}
      </div>

      <div className={styles.cinematicOverlay} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.wordmark} aria-label="Tin Pata home">
          <span className={styles.wordmarkGlyph}>TP</span>
          <span className={styles.wordmarkText}>
            Tin Pata
            <small>Pictures</small>
          </span>
        </Link>

        <p className={styles.collectionLabel}>
          <span /> Original collection · 2026
        </p>
      </header>

      <section className={styles.content} aria-live="polite" aria-atomic="true">
        <article className={styles.copy} key={activeScene.id}>
          <p className={styles.eyebrow}>A Tin Pata original motion picture</p>
          <h1
            className={styles.title}
            aria-label={`${activeScene.titleLineOne} ${activeScene.titleLineTwo}`}
          >
            <span aria-hidden="true">{activeScene.titleLineOne}</span>
            <span aria-hidden="true">{activeScene.titleLineTwo}</span>
          </h1>

          <div className={styles.metadata} aria-label="Movie details">
            <span>{activeScene.year}</span>
            <span>{activeScene.genre}</span>
            <span>{activeScene.runtime}</span>
            <span className={styles.rating}>{activeScene.rating}</span>
          </div>

          <p className={styles.description}>{activeScene.description}</p>

          <div className={styles.actions}>
            <button className={styles.primaryButton} type="button" onClick={openTrailer}>
              <PlayIcon />
              Watch trailer
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={toggleSaved}
              aria-pressed={isSaved}
            >
              <PlusIcon checked={isSaved} />
              {isSaved ? 'In my list' : 'My list'}
            </button>
          </div>
        </article>
      </section>

      <div className={styles.bottomRail}>
        <button
          className={styles.autoplayButton}
          type="button"
          onClick={togglePlayback}
          aria-label={
            isPlaying ? 'Pause automatic scene changes' : 'Resume automatic scene changes'
          }
        >
          <span className={isPlaying ? styles.pauseIcon : styles.playIcon} aria-hidden="true" />
          {isPlaying ? 'Playing' : 'Paused'}
        </button>

        <nav className={styles.sceneNavigation} aria-label="Featured movies">
          {scenes.map((scene, index) => (
            <button
              className={styles.sceneMarker}
              type="button"
              key={scene.id}
              onClick={() => selectScene(index)}
              aria-label={`Show ${scene.titleLineOne} ${scene.titleLineTwo}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            >
              <span className={styles.sceneNumber}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.markerTrack}>
                {index === activeIndex ? (
                  <span
                    className={`${styles.markerProgress} ${!isPlaying || isTrailerOpen ? styles.progressPaused : ''}`}
                    key={`${activeScene.id}-${cycle}`}
                  />
                ) : null}
              </span>
            </button>
          ))}
        </nav>

        <div className={styles.arrowNavigation}>
          <button type="button" onClick={() => stepScene(-1)} aria-label="Previous movie">
            <ArrowIcon direction="left" />
          </button>
          <button type="button" onClick={() => stepScene(1)} aria-label="Next movie">
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.trailerDialog}
        onClose={() => {
          setIsTrailerOpen(false);
          setCycle((current) => current + 1);
        }}
      >
        <div className={styles.dialogFrame}>
          <div
            className={styles.dialogImage}
            style={{
              backgroundImage: `url("${activeScene.image}")`,
              backgroundPosition: activeScene.position,
            }}
            aria-hidden="true"
          />
          <div className={styles.dialogShade} aria-hidden="true" />
          <button
            className={styles.closeButton}
            type="button"
            onClick={closeTrailer}
            aria-label="Close trailer preview"
          >
            <span aria-hidden="true">×</span>
          </button>
          <div className={styles.dialogCopy}>
            <p>Trailer preview</p>
            <h2>
              {activeScene.titleLineOne} {activeScene.titleLineTwo}
            </h2>
            <span>Official trailer arriving soon</span>
          </div>
        </div>
      </dialog>
    </main>
  );
}
