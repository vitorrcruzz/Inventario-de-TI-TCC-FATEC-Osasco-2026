import os
import ipaddress
from easysnmp import Session, EasySNMPError

OIDS = {
    "descricao":     "1.3.6.1.2.1.1.1.0",
    "oid_empresa":   "1.3.6.1.2.1.1.2.0",
    "uptime":        "1.3.6.1.2.1.1.3.0",
    "contato":       "1.3.6.1.2.1.1.4.0",
    "hostname":      "1.3.6.1.2.1.1.5.0",
    "localizacao":   "1.3.6.1.2.1.1.6.0",
    "interfaces":    "1.3.6.1.2.1.2.1.0",
    "roteador":      "1.3.6.1.2.1.4.1.0",
    # OIDs customizados (simulados nos .snmprec)
    "modelo":        "1.3.6.1.99.1.1.0",
    "sistema_op":    "1.3.6.1.99.1.2.0",
    "armazenamento": "1.3.6.1.99.1.3.0",
    "memoria":       "1.3.6.1.99.1.4.0",
    "processador":   "1.3.6.1.99.1.5.0",
}

def detectar_tipo(dados: dict) -> str:
    desc  = (dados.get("descricao")   or "").lower()
    host  = (dados.get("hostname")    or "").lower()
    modelo = (dados.get("modelo")     or "").lower()
    is_router = str(dados.get("roteador", "0")).strip() == "1"

    if "cisco" in desc or "catalyst" in desc or "sw-" in host:
        return "Switch"
    if "routeros" in desc or "mikrotik" in desc or "rtr-" in host:
        return "Roteador"
    if "unifi" in desc or "ubiquiti" in desc or "ap-" in host:
        return "Access Point"
    if "hikvision" in desc or "dahua" in desc or "cam-" in host or "camera" in modelo:
        return "Camera IP"
    if "smart-ups" in desc or "apc" in desc or "ups-" in host or "nobreak" in modelo or "ups" in modelo:
        return "Nobreak"
    if "laserjet" in desc or "printer" in desc or "imp-" in host:
        return "Impressora"
    if "windows" in desc or "pc-" in host:
        return "Computador"
    if "notebook" in modelo or "inspiron" in modelo or "nb-" in host:
        return "Notebook"
    if is_router:
        return "Roteador"
    try:
        if int(dados.get("interfaces", 0)) >= 24:
            return "Switch"
    except Exception:
        pass
    if "linux" in desc or "ubuntu" in desc:
        return "Servidor"
    return "Desconhecido"

def formatar_uptime(centisegundos: str) -> str:
    try:
        cs = int(centisegundos)
        segundos = cs // 100
        dias  = segundos // 86400
        horas = (segundos % 86400) // 3600
        mins  = (segundos % 3600) // 60
        return f"{dias}d {horas}h {mins}m"
    except Exception:
        return centisegundos

def escanear_dispositivo(ip: str, community: str = "public") -> dict:
    resultado = {"ip": ip, "status": "offline", "dados": {}}
    try:
        session = Session(
            hostname=ip,
            community=community,
            version=2,
            timeout=2,
            retries=1,
        )
        for chave, oid in OIDS.items():
            try:
                val = session.get(oid)
                resultado["dados"][chave] = str(val.value)
            except Exception:
                resultado["dados"][chave] = None

        resultado["dados"]["uptime_fmt"] = formatar_uptime(
            resultado["dados"].get("uptime", "0")
        )
        resultado["dados"]["tipo"] = detectar_tipo(resultado["dados"])
        resultado["status"] = "online"

    except EasySNMPError:
        resultado["status"] = "offline"
    except Exception as e:
        resultado["status"] = "erro"
        resultado["erro"] = str(e)

    return resultado

def descobrir_hosts(rede: str = "172.20.0.0/24") -> list:
    hosts = []
    try:
        import nmap
        scanner = nmap.PortScanner()
        scanner.scan(hosts=rede, arguments="-sn --host-timeout 3s")
        hosts = [h for h in scanner.all_hosts()
                 if scanner[h].state() == "up"]
    except Exception:
        network = ipaddress.ip_network(rede, strict=False)
        hosts = [str(ip) for ip in network.hosts()]
    return hosts

def escanear_rede(rede: str = "172.20.0.0/24", community: str = "public") -> list:
    hosts = descobrir_hosts(rede)
    resultados = []
    for ip in hosts:
        resultado = escanear_dispositivo(ip, community)
        if resultado["status"] == "online":
            resultados.append(resultado)
    return resultados