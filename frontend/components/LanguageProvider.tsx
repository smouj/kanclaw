'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'es' | 'en' | 'fr';

type Dict = Record<string, Record<Lang, string>>;

const dictionary: Dict = {
  'nav.overview': { es: 'Overview', en: 'Overview', fr: 'Vue d\'ensemble' },
  'nav.chat': { es: 'Chat', en: 'Chat', fr: 'Chat' },
  'nav.board': { es: 'Board', en: 'Board', fr: 'Tableau' },
  'nav.memory': { es: 'Memoria', en: 'Memory', fr: 'Mémoire' },
  'nav.files': { es: 'Archivos', en: 'Files', fr: 'Fichiers' },
  'nav.connectors': { es: 'Connectores', en: 'Connectors', fr: 'Connecteurs' },

  'chat.connected': { es: 'Conectado', en: 'Connected', fr: 'Connecté' },
  'chat.disconnected': { es: 'Desconectado', en: 'Disconnected', fr: 'Déconnecté' },
  'chat.thinking': { es: 'Procesando respuesta...', en: 'Thinking…', fr: 'Réflexion…' },
  'chat.send': { es: 'Enviar', en: 'Send', fr: 'Envoyer' },
  'chat.selectThread': { es: 'Selecciona un hilo', en: 'Select a thread', fr: 'Sélectionnez un fil' },
  'chat.noMessages': { es: 'Sin conversación aún', en: 'No conversation yet', fr: 'Pas encore de conversation' },
  'chat.startConversation': { es: 'Envía un mensaje para empezar', en: 'Send a message to start', fr: 'Envoyez un message pour commencer' },
  'chat.selectAgent': { es: 'Selecciona un agente:', en: 'Select an agent:', fr: 'Sélectionnez un agent :' },
  'chat.messages': { es: 'mensajes', en: 'messages', fr: 'messages' },
  'chat.context': { es: 'Contexto:', en: 'Context:', fr: 'Contexte :' },
  'chat.conversations': { es: 'Conversaciones', en: 'Conversations', fr: 'Conversations' },
  'chat.noMessagesShort': { es: 'Sin mensajes', en: 'No messages', fr: 'Aucun message' },
  'chat.teamRoom': { es: 'Sala del equipo', en: 'Team room', fr: 'Salle d\'équipe' },
  'chat.agentRoom': { es: 'Sala de agente', en: 'Agent room', fr: 'Salle agent' },
  'chat.you': { es: 'Tú', en: 'You', fr: 'Vous' },
  'chat.stats': { es: 'Estadísticas', en: 'Stats', fr: 'Statistiques' },
  'chat.total': { es: 'Total', en: 'Total', fr: 'Total' },
  'chat.human': { es: 'Humano', en: 'Human', fr: 'Humain' },
  'chat.agent': { es: 'Agente', en: 'Agent', fr: 'Agent' },
  'chat.selectedMessage': { es: 'Mensaje seleccionado', en: 'Selected message', fr: 'Message sélectionné' },
  'chat.writePrompt': { es: 'Escribe tu prompt... (Shift+Enter nueva línea)', en: 'Write your prompt... (Shift+Enter newline)', fr: 'Écrivez votre prompt... (Shift+Entrée nouvelle ligne)' },
  'chat.copyError': { es: 'No se pudo copiar', en: 'Could not copy', fr: 'Impossible de copier' },
  'chat.copy': { es: 'Copiar', en: 'Copy', fr: 'Copier' },
  'chat.copied': { es: 'Copiado', en: 'Copied', fr: 'Copié' },
  'chat.code': { es: 'código', en: 'code', fr: 'code' },
  'chat.sendError': { es: 'No se pudo enviar el mensaje.', en: 'Could not send message.', fr: 'Impossible d\'envoyer le message.' },

  'overview.conversations': { es: 'Conversaciones', en: 'Conversations', fr: 'Conversations' },
  'overview.tasks': { es: 'Tareas', en: 'Tasks', fr: 'Tâches' },
  'overview.runs': { es: 'Ejecuciones', en: 'Runs', fr: 'Exécutions' },
  'overview.snapshots': { es: 'Snapshots', en: 'Snapshots', fr: 'Captures' },
  'overview.agents': { es: 'Agentes del proyecto', en: 'Project agents', fr: 'Agents du projet' },
  'overview.activity': { es: 'Actividad reciente', en: 'Recent activity', fr: 'Activité récente' },
  'overview.noActivity': { es: 'Sin actividad registrada', en: 'No activity recorded', fr: 'Aucune activité enregistrée' },

  'board.title': { es: 'Kanban', en: 'Kanban', fr: 'Kanban' },
  'board.execution': { es: 'Tablero de ejecución', en: 'Execution board', fr: 'Tableau d\'exécution' },
  'board.createQuickTask': { es: 'Crear tarea rápida', en: 'Create quick task', fr: 'Créer une tâche rapide' },
  'board.add': { es: 'Añadir', en: 'Add', fr: 'Ajouter' },
  'board.emptyIn': { es: 'No hay tareas en', en: 'No tasks in', fr: 'Aucune tâche dans' },
  'board.updateError': { es: 'No se pudo actualizar el estado.', en: 'Could not update status.', fr: 'Impossible de mettre à jour le statut.' },
  'board.createError': { es: 'No se pudo crear la tarea.', en: 'Could not create task.', fr: 'Impossible de créer la tâche.' },

  'memory.projectMemory': { es: 'Memoria del proyecto', en: 'Project memory', fr: 'Mémoire du projet' },
  'memory.knowledgeFiles': { es: 'Archivos de conocimiento', en: 'Knowledge files', fr: 'Fichiers de connaissance' },
  'memory.decisionFiles': { es: 'Archivos de decisiones', en: 'Decision files', fr: 'Fichiers de décisions' },
  'memory.imports': { es: 'Importaciones', en: 'Imports', fr: 'Importations' },
  'memory.snapshots': { es: 'Snapshots', en: 'Snapshots', fr: 'Captures' },
  'memory.knowledge': { es: 'Conocimiento', en: 'Knowledge', fr: 'Connaissance' },
  'memory.decisions': { es: 'Decisiones', en: 'Decisions', fr: 'Décisions' },
  'memory.artifacts': { es: 'Artefactos', en: 'Artifacts', fr: 'Artefacts' },
  'memory.runs': { es: 'Runs', en: 'Runs', fr: 'Exécutions' },
  'memory.agents': { es: 'Agentes', en: 'Agents', fr: 'Agents' },
  'memory.emptyKnowledge': { es: 'Todavía no hay conocimiento persistido.', en: 'No persistent knowledge yet.', fr: 'Aucune connaissance persistante pour le moment.' },
  'memory.emptyDecisions': { es: 'Todavía no hay decisiones registradas.', en: 'No decisions recorded yet.', fr: 'Aucune décision enregistrée.' },
  'memory.emptyArtifacts': { es: 'Todavía no hay artefactos generados.', en: 'No generated artifacts yet.', fr: 'Aucun artefact généré.' },
  'memory.emptyRuns': { es: 'No hay runs recientes.', en: 'No recent runs.', fr: 'Aucune exécution récente.' },
  'memory.emptySnapshots': { es: 'No se han creado snapshots todavía.', en: 'No snapshots created yet.', fr: 'Aucune capture créée pour le moment.' },
  'memory.noContentYet': { es: 'Sin contenido todavía.', en: 'No content yet.', fr: 'Pas encore de contenu.' },


  'files.search': { es: 'Buscar archivos...', en: 'Search files...', fr: 'Rechercher des fichiers...' },
  'files.newFile': { es: 'Nuevo archivo', en: 'New file', fr: 'Nouveau fichier' },
  'files.selectFile': { es: 'Selecciona un archivo', en: 'Select a file', fr: 'Sélectionner un fichier' },
  'files.loading': { es: 'Cargando archivo...', en: 'Loading file...', fr: 'Chargement du fichier...' },
  'files.noFiles': { es: 'No hay archivos aún.', en: 'No files yet.', fr: 'Aucun fichier pour le moment.' },
  'files.noResults': { es: 'No se encontraron archivos.', en: 'No files found.', fr: 'Aucun fichier trouvé.' },
  'files.unsaved': { es: 'Sin guardar', en: 'Unsaved', fr: 'Non enregistré' },
  'files.nameRequired': { es: 'Introduce un nombre de archivo.', en: 'Enter a file name.', fr: 'Saisissez un nom de fichier.' },
  'files.openError': { es: 'No se pudo abrir el archivo.', en: 'Could not open file.', fr: 'Impossible d\'ouvrir le fichier.' },
  'files.saveError': { es: 'No se pudo guardar el archivo.', en: 'Could not save file.', fr: 'Impossible d\'enregistrer le fichier.' },
  'files.createError': { es: 'No se pudo crear el archivo.', en: 'Could not create file.', fr: 'Impossible de créer le fichier.' },
  'files.savedOk': { es: 'Archivo guardado.', en: 'File saved.', fr: 'Fichier enregistré.' },
  'files.createdOk': { es: 'Archivo creado.', en: 'File created.', fr: 'Fichier créé.' },
  'files.selectFileEdit': { es: 'Selecciona un archivo para editar', en: 'Select a file to edit', fr: 'Sélectionnez un fichier à éditer' },
  'files.discardConfirm': { es: 'Hay cambios sin guardar. ¿Descartar cambios?', en: 'Unsaved changes. Discard changes?', fr: 'Modifications non enregistrées. Ignorer les modifications ?' },
  'files.create': { es: 'Crear', en: 'Create', fr: 'Créer' },
  'files.saving': { es: 'Guardando...', en: 'Saving...', fr: 'Enregistrement...' },
  'files.writePlaceholder': { es: 'Escribe o pega contenido...', en: 'Write or paste content...', fr: 'Écrire ou coller le contenu...' },
  'files.createHint': { es: 'O crea uno nuevo con el botón', en: 'Or create a new one with the button', fr: 'Ou créez-en un nouveau avec le bouton' },
  'files.pathPlaceholder': { es: 'ruta/archivo.md', en: 'path/file.md', fr: 'chemin/fichier.md' },

  'connectors.github': { es: 'Conector GitHub', en: 'GitHub connector', fr: 'Connecteur GitHub' },
  'connectors.connectImport': { es: 'Conectar e importar', en: 'Connect and import', fr: 'Connecter et importer' },
  'connectors.notConfigured': { es: 'No configurado', en: 'Not configured', fr: 'Non configuré' },
  'connectors.loadRepos': { es: 'Cargar repositorios', en: 'Load repositories', fr: 'Charger les dépôts' },
  'connectors.localImport': { es: 'Importar carpeta local', en: 'Local folder import', fr: 'Import local' },
  'connectors.repoBrowser': { es: 'Explorador de repositorios', en: 'Repository browser', fr: 'Navigateur de dépôts' },
  'connectors.attachProject': { es: 'Vincular al proyecto', en: 'Attach to project', fr: 'Lier au projet' },
  'connectors.createProject': { es: 'Importar como proyecto nuevo', en: 'Import as new project', fr: 'Importer comme nouveau projet' },
  'connectors.noDescription': { es: 'Sin descripción', en: 'No description', fr: 'Sans description' },
  'connectors.selectRepo': { es: 'Selecciona un repositorio para inspeccionarlo e importarlo.', en: 'Select a repository to inspect and import.', fr: 'Sélectionnez un dépôt pour l\'inspecter et l\'importer.' },
  'connectors.readmePreview': { es: 'Vista previa README', en: 'README preview', fr: 'Aperçu README' },
  'connectors.readmeUnavailable': { es: 'README no disponible.', en: 'README unavailable.', fr: 'README indisponible.' },
  'connectors.patPlaceholder': { es: 'GitHub PAT', en: 'GitHub PAT', fr: 'GitHub PAT' },
  'connectors.localPathPlaceholder': { es: '/ruta/proyecto/local', en: '/path/to/local/project', fr: '/chemin/projet/local' },
  'connectors.defaultBranch': { es: 'Rama por defecto', en: 'Default branch', fr: 'Branche par défaut' },
  'connectors.visibility': { es: 'Visibilidad', en: 'Visibility', fr: 'Visibilité' },
  'connectors.localImportError': { es: 'No se pudo importar la carpeta local.', en: 'Could not import local folder.', fr: 'Impossible d\'importer le dossier local.' },
  'connectors.localConnected': { es: 'Carpeta local conectada.', en: 'Local folder connected.', fr: 'Dossier local connecté.' },
  'connectors.importCreated': { es: 'Repositorio importado como proyecto.', en: 'Repository imported as project.', fr: 'Dépôt importé comme projet.' },
  'connectors.importAttached': { es: 'Repositorio vinculado al proyecto.', en: 'Repository attached to project.', fr: 'Dépôt lié au projet.' },
  'connectors.connectedOk': { es: 'GitHub conectado.', en: 'GitHub connected.', fr: 'GitHub connecté.' },
  'connectors.connectError': { es: 'No se pudo conectar GitHub.', en: 'Could not connect GitHub.', fr: 'Impossible de connecter GitHub.' },
  'connectors.loadError': { es: 'No se pudieron cargar los repositorios.', en: 'Could not load repositories.', fr: 'Impossible de charger les dépôts.' },
  'connectors.previewError': { es: 'No se pudo inspeccionar el repositorio.', en: 'Could not inspect repository.', fr: 'Impossible d\'inspecter le dépôt.' },
  'connectors.importError': { es: 'No se pudo importar el repositorio.', en: 'Could not import repository.', fr: 'Impossible d\'importer le dépôt.' },


  'overview.delegations': { es: 'Delegaciones', en: 'Delegations', fr: 'Délégations' },
  'overview.imports': { es: 'Importaciones', en: 'Imports', fr: 'Importations' },
  'overview.memory': { es: 'Memoria', en: 'Memory', fr: 'Mémoire' },
  'overview.memoryActive': { es: 'Activa', en: 'Active', fr: 'Active' },
  'overview.memoryEmpty': { es: 'Vacía', en: 'Empty', fr: 'Vide' },
  'overview.knowledgeFilesCount': { es: 'archivos de conocimiento', en: 'knowledge files', fr: 'fichiers de connaissance' },
  'overview.projectWorkspace': { es: 'Workspace del proyecto', en: 'Project workspace', fr: 'Espace de travail du projet' },
  'overview.noRole': { es: 'Sin rol', en: 'No role', fr: 'Sans rôle' },

  'sidebar.agents': { es: 'Agentes', en: 'Agents', fr: 'Agents' },
  'sidebar.signals': { es: 'Señales', en: 'Signals', fr: 'Signaux' },
  'sidebar.command': { es: 'Comandos', en: 'Command', fr: 'Commande' },
  'sidebar.agentsCount': { es: 'Agentes', en: 'Agents', fr: 'Agents' },
  'sidebar.tasksCount': { es: 'Tareas', en: 'Tasks', fr: 'Tâches' },
  'sidebar.runsCount': { es: 'Runs', en: 'Runs', fr: 'Exécutions' },
  'sidebar.connectorsCount': { es: 'Connectores', en: 'Connectors', fr: 'Connecteurs' },
  'sidebar.addAgent': { es: 'Añadir agente', en: 'Add agent', fr: 'Ajouter un agent' },
  'sidebar.newAgentName': { es: 'Nombre del agente...', en: 'New agent name...', fr: 'Nom du nouvel agent...' },

  'actions.addDecision': { es: 'Añadir decisión', en: 'Add decision', fr: 'Ajouter une décision' },
  'actions.addKnowledge': { es: 'Añadir conocimiento', en: 'Add knowledge', fr: 'Ajouter de la connaissance' },
  'actions.decisionPlaceholder': { es: 'Describe la decisión...', en: 'Decision description...', fr: 'Description de la décision...' },
  'actions.knowledgePlaceholder': { es: 'Contenido de conocimiento...', en: 'Knowledge content...', fr: 'Contenu de connaissance...' },
  'actions.knowledgePathPlaceholder': { es: 'knowledge/notas.md', en: 'knowledge/notes.md', fr: 'knowledge/notes.md' },

  'toast.snapshotCreated': { es: 'Snapshot creado.', en: 'Snapshot created.', fr: 'Capture créée.' },
  'toast.snapshotError': { es: 'No se pudo crear el snapshot.', en: 'Could not create snapshot.', fr: 'Impossible de créer la capture.' },
  'toast.agentCreated': { es: 'Agente creado.', en: 'Agent created.', fr: 'Agent créé.' },
  'toast.agentCreateError': { es: 'No se pudo crear el agente.', en: 'Could not create agent.', fr: 'Impossible de créer l\'agent.' },
  'toast.decisionSaved': { es: 'Decisión registrada.', en: 'Decision recorded.', fr: 'Décision enregistrée.' },
  'toast.decisionError': { es: 'No se pudo guardar la decisión.', en: 'Could not save decision.', fr: 'Impossible d\'enregistrer la décision.' },
  'toast.knowledgeSaved': { es: 'Conocimiento actualizado.', en: 'Knowledge updated.', fr: 'Connaissance mise à jour.' },
  'toast.knowledgeError': { es: 'No se pudo guardar el conocimiento.', en: 'Could not save knowledge.', fr: 'Impossible d\'enregistrer la connaissance.' },

  'command.overview': { es: 'Abrir overview del proyecto', en: 'Open project overview', fr: 'Ouvrir la vue d\'ensemble du projet' },
  'command.overviewHint': { es: 'Resumen del Project OS', en: 'Project OS summary', fr: 'Résumé Project OS' },
  'command.teamRoom': { es: 'Hablar con el team room', en: 'Open team room chat', fr: 'Ouvrir le chat équipe' },
  'command.teamRoomHint': { es: 'Chat compartido', en: 'Shared chat', fr: 'Chat partagé' },
  'command.board': { es: 'Abrir tablero Kanban', en: 'Open Kanban board', fr: 'Ouvrir le tableau Kanban' },
  'command.boardHint': { es: 'Tareas y delegación', en: 'Tasks and delegation', fr: 'Tâches et délégation' },
  'command.memory': { es: 'Abrir Memory Hub', en: 'Open Memory Hub', fr: 'Ouvrir le Memory Hub' },
  'command.memoryHint': { es: 'Knowledge, decisiones, runs', en: 'Knowledge, decisions, runs', fr: 'Connaissance, décisions, exécutions' },
  'command.files': { es: 'Abrir filesystem', en: 'Open filesystem', fr: 'Ouvrir le système de fichiers' },
  'command.filesHint': { es: 'Workspace real en disco', en: 'Real workspace on disk', fr: 'Workspace réel sur disque' },
  'command.connectors': { es: 'Abrir connectors', en: 'Open connectors', fr: 'Ouvrir les connecteurs' },
  'command.connectorsHint': { es: 'GitHub y carpeta local', en: 'GitHub and local folder', fr: 'GitHub et dossier local' },
  'command.snapshot': { es: 'Crear snapshot', en: 'Create snapshot', fr: 'Créer une capture' },
  'command.snapshotHint': { es: 'Estado exportable', en: 'Exportable state', fr: 'État exportable' },
  'command.reconnect': { es: 'Refrescar OpenClaw', en: 'Refresh OpenClaw', fr: 'Rafraîchir OpenClaw' },
  'command.reconnectHint': { es: 'Releer shell', en: 'Reload shell', fr: 'Recharger le shell' },
  'command.chatWith': { es: 'Hablar con', en: 'Chat with', fr: 'Chat avec' },
  'command.agentHint': { es: 'Agente del proyecto', en: 'Project agent', fr: 'Agent du projet' },

  'common.refresh': { es: 'Refresh', en: 'Refresh', fr: 'Rafraîchir' },
  'common.snapshot': { es: 'Snapshot', en: 'Snapshot', fr: 'Capture' },
  'common.quickActions': { es: 'Acciones rápidas', en: 'Quick actions', fr: 'Actions rapides' },
  'common.save': { es: 'Guardar', en: 'Save', fr: 'Enregistrer' },
  'common.updated': { es: 'Actualizado', en: 'Updated', fr: 'Mis à jour' },
};

interface LanguageContextValue {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const locales: Record<Lang, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const saved = localStorage.getItem('kanclaw-lang') as Lang | null;
    if (saved && ['es', 'en', 'fr'].includes(saved)) {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem('kanclaw-lang', next);
    document.documentElement.lang = next;
  };

  const t = useCallback((key: string, fallback?: string) => {
    const item = dictionary[key];
    if (!item) return fallback || key;
    return item[lang] || fallback || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, locale: locales[lang], setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside LanguageProvider');
  }
  return ctx;
}
