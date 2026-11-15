/** Símbolos elementais em caminhos SVG, sem texto Unicode ou dependência de fonte.
 *  Água, Terra, Fogo e Ar mantêm os ideogramas rituais usados originalmente.
 *  O navegador não pode traduzi-los nem substituí-los por glifos ausentes.
 */
export type ElementoId = "agua" | "terra" | "fogo" | "ar" | "neutro";

const TRACOS: Record<Exclude<ElementoId, "neutro">, string> = {
  agua: "M815 679C781 613 714 509 651 429C610 504 578 594 559 703V805C585 809 592 818 594 832L439 848V64C439 50 433 44 415 44C390 44 267 52 267 52V38C324 29 349 16 368 -3C386 -22 393 -49 397 -88C540 -76 559 -29 559 55V631C608 304 710 140 868 10C885 65 922 106 971 115L975 126C862 182 748 265 665 405C758 458 852 527 913 579C937 576 947 581 953 591ZM44 555 53 526H277C245 337 167 142 21 17L30 6C250 120 351 313 398 510C421 512 430 515 437 525L331 617L271 555Z",
  terra: "M93 487 101 459H433V-8H30L39 -37H942C957 -37 968 -32 971 -21C921 22 839 84 839 84L766 -8H558V459H886C901 459 912 464 914 475C866 517 786 577 786 577L716 487H558V804C585 808 592 818 595 834L433 849V487Z",
  fogo: "M227 676C232 566 179 474 127 439C95 416 79 380 98 343C122 304 180 299 220 337C277 389 315 504 238 677ZM790 673C752 595 672 469 599 379C558 487 539 620 531 784V799C556 803 566 812 568 828L400 844C400 434 426 146 26 -73L36 -88C432 50 507 265 524 548C551 233 629 25 869 -89C883 -25 921 15 979 26L980 37C782 103 669 205 605 361C717 421 826 506 897 570C921 565 931 571 936 581Z",
  ar: "M757 649 696 571H257L265 543H843C857 543 868 548 871 559C828 596 757 649 757 649ZM403 800 239 854C198 669 113 484 30 368L41 360C148 434 239 538 311 673H912C927 673 937 678 940 689C893 730 820 783 820 783L755 702H326C339 727 351 754 362 781C385 780 398 788 403 800ZM636 436H155L164 407H647C651 176 676 -15 856 -73C911 -93 962 -92 983 -49C992 -26 986 -2 956 32L960 155L949 156C940 121 930 89 919 63C914 52 908 49 892 53C778 82 762 253 767 396C785 399 800 404 807 412L694 498Z",
};

type Props = {
  elemento: ElementoId;
  className?: string;
};

export function IconeElemental({ elemento, className }: Props) {
  if (elemento === "neutro") {
    return (
      <svg className={className ? `icone-elemental ${className}` : "icone-elemental"}
        viewBox="0 0 1000 1000" role="presentation" aria-hidden="true" focusable="false"
        fill="currentColor">
        <path d="M500 78C544 303 698 456 922 500C698 544 544 697 500 922C456 697 302 544 78 500C302 456 456 303 500 78Z" />
      </svg>
    );
  }

  return (
    <svg className={className ? `icone-elemental ${className}` : "icone-elemental"}
      viewBox="0 0 1000 1000" role="presentation" aria-hidden="true" focusable="false"
      fill="currentColor">
      <g transform="translate(0 900) scale(1 -1)">
        <path d={TRACOS[elemento]} />
      </g>
    </svg>
  );
}
